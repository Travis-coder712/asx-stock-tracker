"""One-command refresh orchestrator — used by the weekly GitHub Action.

Encapsulates the full refresh *with the self-healing that a manual run needs*,
so the scheduled job never silently ships stale or split-broken data:

  1. Bootstrap the DB (full history) if it's empty; else incremental import.
  2. SELF-HEAL the core tickers (every held/frozen name + the indices + AGL):
     always DELETE + re-fetch full history, with retries, so their adj_close is
     fresh and internally consistent (no stale ticker, no unadjusted-split gap).
  3. verify_prices.py — hard-fails if any held ticker is still stale/broken.
  4. Rebuild portfolios from FROZEN picks, recompute, export.
  5. Bump the version in package.json + metadata.json in sync.

Run:  python pipeline/refresh.py            (incremental, as the cron does)
      python pipeline/refresh.py --full     (force full rebuild of all tickers)
"""

import os
import re
import sys
import json
import time
import sqlite3
import subprocess
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, 'database', 'asx_tracker.db')
INCREMENTAL_DAYS = 180
CORE_EXTRA = ['^ATOI', '^AXJO', 'AGL.AX']


def run(cmd):
    print(f"\n$ {' '.join(cmd)}", flush=True)
    r = subprocess.run(cmd, cwd=ROOT)
    if r.returncode != 0:
        raise SystemExit(f"step failed ({r.returncode}): {' '.join(cmd)}")


def db_is_empty():
    if not os.path.exists(DB_PATH):
        return True
    c = sqlite3.connect(DB_PATH)
    try:
        n = c.execute("SELECT COUNT(*) FROM price_history").fetchone()[0]
        return n == 0
    except sqlite3.OperationalError:
        return True
    finally:
        c.close()


def core_tickers():
    """Held/frozen tickers + indices + AGL — the names that must be clean."""
    c = sqlite3.connect(DB_PATH)
    t = set(CORE_EXTRA)
    for tbl in ('portfolio_holdings', 'frozen_picks'):
        try:
            t |= set(r[0] for r in c.execute(f"SELECT DISTINCT ticker FROM {tbl}"))
        except sqlite3.OperationalError:
            pass
    c.close()
    return sorted(x for x in t if x)


def self_heal(tickers):
    """DELETE + full re-fetch each core ticker so adj_close is fresh + consistent."""
    import yfinance as yf
    c = sqlite3.connect(DB_PATH)
    latest = c.execute("SELECT MAX(date) FROM price_history").fetchone()[0]
    print(f"\nSelf-healing {len(tickers)} core tickers (latest in DB: {latest})")
    failed = []
    for t in tickers:
        rows = None
        for attempt in range(4):
            try:
                h = yf.Ticker(t).history(start='2023-01-01', auto_adjust=False)
                if not h.empty:
                    rows = [(t, di.strftime('%Y-%m-%d'), float(r['Open']), float(r['High']),
                             float(r['Low']), float(r['Close']),
                             float(r.get('Adj Close', r['Close'])), int(r['Volume']))
                            for di, r in h.iterrows()]
                    break
            except Exception:
                pass
            time.sleep(2)
        if not rows:
            failed.append(t)
            continue
        c.execute("DELETE FROM price_history WHERE ticker=?", (t,))
        c.executemany(
            "INSERT OR IGNORE INTO price_history "
            "(ticker,date,open,high,low,close,adj_close,volume) VALUES (?,?,?,?,?,?,?,?)", rows)
        c.commit()
        time.sleep(0.3)
    c.close()
    if failed:
        # Indices/AGL that genuinely delist are rare; a core equity failing is a real problem.
        print(f"WARNING: could not refetch: {failed}")
    return failed


def bump_version():
    pkg = os.path.join(ROOT, 'frontend', 'package.json')
    meta = os.path.join(ROOT, 'frontend', 'public', 'data', 'metadata.json')
    p = open(pkg).read()
    cur = re.search(r'"version":\s*"(\d+)\.(\d+)\.(\d+)"', p)
    major, minor, patch = (int(cur.group(i)) for i in (1, 2, 3))
    new = f"{major}.{minor}.{patch + 1}"
    open(pkg, 'w').write(re.sub(r'("version":\s*)"\d+\.\d+\.\d+"', rf'\1"{new}"', p, count=1))
    m = json.load(open(meta))
    m['version'] = new
    c = sqlite3.connect(DB_PATH)
    m['stockCount'] = c.execute("SELECT COUNT(DISTINCT ticker) FROM price_history").fetchone()[0]
    c.close()
    json.dump(m, open(meta, 'w'), indent=2)
    print(f"\nVersion bumped to {new} (stockCount {m['stockCount']}, data to {m.get('latestPrice')})")
    return new


def main():
    full = '--full' in sys.argv
    py = sys.executable

    run([py, 'pipeline/setup_db.py'])

    if full or db_is_empty():
        print("\n== Full import (all tickers, full history) ==")
        run([py, 'pipeline/importers/import_prices.py', '--all', '--start', '2023-01-01'])
    else:
        start = (date.today() - timedelta(days=INCREMENTAL_DAYS)).isoformat()
        print(f"\n== Incremental import (all tickers, from {start}) ==")
        run([py, 'pipeline/importers/import_prices.py', '--all', '--start', start])

    self_heal(core_tickers())

    run([py, 'pipeline/importers/verify_prices.py'])          # hard fail on stale/broken core
    run([py, '-m', 'pipeline.models.build_main_portfolios'])  # re-price frozen main + archive fundamentals
    run([py, '-m', 'pipeline.models.compute_tsr'])
    run([py, '-m', 'pipeline.models.run_all_periods'])        # frozen-aware; freezes any new period once
    run([py, '-m', 'pipeline.models.compute_hold_periods'])
    run([py, '-m', 'pipeline.models.compute_peer_tsr'])
    run([py, '-m', 'pipeline.models.pick_today'])
    run([py, 'pipeline/exporters/export_json.py'])
    run([py, '-m', 'pipeline.exporters.export_risk'])
    run([py, '-m', 'pipeline.exporters.export_stress'])

    bump_version()
    print("\nRefresh complete.")


if __name__ == '__main__':
    main()
