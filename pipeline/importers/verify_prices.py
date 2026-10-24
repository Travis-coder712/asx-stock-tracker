"""Post-import data sanity checker.

Catches the two failure modes of the yfinance INSERT-OR-IGNORE refresh:
  1. Stale tickers — a held/picked name that silently failed mid-batch and is
     not fresh to the latest overall price date.
  2. Adjustment discontinuities — a single-day adj_close jump far too large to
     be a real move (post-split names whose old rows were never re-based).

Exits non-zero if any HELD/FROZEN ticker is affected, so a scheduled refresh can
fail loudly instead of shipping a fake "crash".
"""

import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
JUMP_HI = 1.60   # >60% up in a day
JUMP_LO = 0.62   # >38% down in a day


def main():
    conn = sqlite3.connect(DB_PATH)
    latest = conn.execute("SELECT MAX(date) FROM price_history").fetchone()[0]

    held = set(r[0] for r in conn.execute("SELECT DISTINCT ticker FROM portfolio_holdings"))
    try:
        held |= set(r[0] for r in conn.execute("SELECT DISTINCT ticker FROM frozen_picks"))
    except sqlite3.OperationalError:
        pass

    problems = []

    # 1. Stale held tickers
    for t in sorted(held):
        md = conn.execute("SELECT MAX(date) FROM price_history WHERE ticker=?", (t,)).fetchone()[0]
        if md is None:
            problems.append(f"MISSING  {t}: no price history")
        elif md < latest:
            problems.append(f"STALE    {t}: max {md} < latest {latest}")

    # 2. Adjustment discontinuities on held tickers.
    # A big one-day jump on NORMAL volume is almost always an unadjusted split or
    # a bad tick (hard fail). The same jump on a VOLUME SPIKE is a real event
    # (e.g. a profit downgrade) — valid data, so only warn.
    for t in sorted(held):
        rows = conn.execute(
            "SELECT date, adj_close, volume FROM price_history WHERE ticker=? AND adj_close IS NOT NULL ORDER BY date",
            (t,)).fetchall()
        vols = sorted(r[2] for r in rows if r[2])
        median_vol = vols[len(vols) // 2] if vols else 0
        for (d0, p0, _), (d1, p1, v1) in zip(rows, rows[1:]):
            if p0 and p1 and (p1 / p0 > JUMP_HI or p1 / p0 < JUMP_LO):
                real = median_vol and v1 and v1 > 3 * median_vol
                tag = "~move " if real else "JUMP  "
                msg = f"{tag}   {t}: {d0} {p0:.2f} -> {d1} {p1:.2f} ({(p1/p0-1)*100:+.0f}%, vol {v1:,} vs med {median_vol:,})"
                if real:
                    print("  note (real move, high volume): " + msg)
                else:
                    problems.append(msg)

    if problems:
        print(f"VERIFY FAILED — {len(problems)} issue(s) on held/frozen tickers:")
        for p in problems:
            print("  " + p)
        print("\nFix: delete + full re-fetch (start 2023-01-01) for the affected tickers, "
              "then re-run build_main_portfolios / run_all_periods.")
        sys.exit(1)

    print(f"VERIFY OK — all {len(held)} held/frozen tickers fresh to {latest}, no discontinuities.")


if __name__ == '__main__':
    main()
