"""LTI tracking time-series + survivorship, per performance period.

For each LTI performance period (= a 30-June comparator snapshot), emits a
monthly time series of AGL's share price, its Total Shareholder Return (dividends
reinvested, via adj_close) and its percentile RANK within the fixed comparator
group as it stood at that point. Also lists the comparator companies that have
since dropped out with no measurable TSR (delisted / taken over) — the
"survivorship" set — so the ranking's approximation is explicit.

Public data only (AGL price + public S&P/ASX 100 membership). Feeds the LTI tab.
Emits frontend/public/data/tsr/lti-tracking.json.
"""

import os
import json
import sqlite3
import bisect
import math
import statistics

from pipeline.data.asx100_constituents import PEER_GROUPS

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
OUT_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data', 'tsr', 'lti-tracking.json')

FY_OF = {'2023-07-01': 'FY24', '2024-07-01': 'FY25', '2025-07-01': 'FY26', '2026-07-01': 'FY27'}

# Why an excluded comparator name has no measurable TSR (mostly takeovers).
EXIT_REASON = {
    'AKE': 'merged → Arcadium', 'AWC': 'acquired by Alcoa', 'NCM': 'acquired by Newmont',
    'ALU': 'acquired by Renesas', 'IPL': 'demerged (Dyno Nobel)', 'LTM': 'acquired by Rio Tinto',
    'SQ2': 'Block CDIs delisted', 'SVW': 'Seven Group privatised', 'VUK': 'Virgin Money UK acquired',
}


def percentile(sorted_vals, p):
    """Value such that p% of sorted_vals fall below it (linear interpolation)."""
    if not sorted_vals:
        return None
    k = (len(sorted_vals) - 1) * (p / 100)
    f, cl = math.floor(k), math.ceil(k)
    if f == cl:
        return sorted_vals[int(k)]
    return sorted_vals[f] * (cl - k) + sorted_vals[cl] * (k - f)


def month_ends(start_iso, end_iso):
    """First-of-month markers from start to end (inclusive-ish)."""
    y, m = int(start_iso[:4]), int(start_iso[5:7])
    ey, em = int(end_iso[:4]), int(end_iso[5:7])
    out = []
    while (y, m) <= (ey, em):
        out.append(f"{y:04d}-{m:02d}-01")
        m += 1
        if m > 12:
            m = 1; y += 1
    out.append(end_iso)  # final partial point = latest
    return out


def main():
    conn = sqlite3.connect(DB_PATH)
    names = {r[0]: r[1] for r in conn.execute("SELECT ticker, name FROM stocks")}
    latest = conn.execute("SELECT MAX(date) FROM price_history").fetchone()[0]

    out = {'asOf': latest, 'periods': {}}

    for period_start, members in PEER_GROUPS.items():
        if period_start > latest:
            continue
        # preload each member's (dates, adj_close, close) once
        series = {}
        for t in members:
            rows = conn.execute(
                "SELECT date, adj_close, close FROM price_history WHERE ticker=? AND date>=? "
                "AND adj_close IS NOT NULL ORDER BY date", (t, period_start)).fetchall()
            if rows:
                series[t] = (
                    [r[0] for r in rows],
                    [r[1] for r in rows],   # adj_close (total return)
                    [r[2] for r in rows],   # raw close (share price)
                )

        def val(t, d, idx):
            s = series.get(t)
            if not s:
                return None
            pos = bisect.bisect_right(s[0], d) - 1
            return s[idx][pos] if pos >= 0 else None

        if 'AGL.AX' not in series:
            continue

        points = []
        for d in month_ends(period_start, latest):
            # TSR for every member to date d
            tsrs = {}
            for t, s in series.items():
                a0 = s[1][0]
                an = val(t, d, 1)
                if a0 and an and a0 > 0:
                    tsrs[t] = (an / a0 - 1) * 100
            if 'AGL.AX' not in tsrs:
                continue
            ordered = sorted(tsrs.values(), reverse=True)
            agl_tsr = tsrs['AGL.AX']
            # percentile: fraction of the group AGL beats
            beaten = sum(1 for v in tsrs.values() if v < agl_tsr)
            pct = round(beaten / (len(tsrs) - 1) * 100, 1) if len(tsrs) > 1 else None
            rank = 1 + sum(1 for v in tsrs.values() if v > agl_tsr)
            price = val('AGL.AX', d, 2)  # raw share price
            points.append({
                'date': d, 'price': round(price, 2) if price else None,
                'tsr': round(agl_tsr, 1), 'pct': pct, 'rank': rank, 'ranked': len(tsrs),
            })

        excluded = []
        for t in members:
            if t not in series:
                code = t.replace('.AX', '')
                excluded.append({'ticker': code, 'name': names.get(t, code),
                                 'reason': EXIT_REASON.get(code, 'delisted / no data')})

        # Target prices: what AGL's price would need to be TODAY to sit at the
        # 50th / 75th percentile, holding every other company where it is now.
        # AGL TSR = adj_close_now / adj_close_start - 1, and for the latest date
        # adj_close == raw close (no future dividends), so the implied raw price
        # for a target TSR T is: adj_close_start * (1 + T).
        agl_adj0 = series['AGL.AX'][1][0]
        others = sorted(
            (val(t, latest, 1) / series[t][1][0] - 1) * 100
            for t in series if t != 'AGL.AX' and series[t][1][0] and val(t, latest, 1)
        )
        targets = None
        if others:
            t50 = statistics.median(others)
            t75 = percentile(others, 75)
            targets = {
                'currentPrice': round(val('AGL.AX', latest, 2), 2),
                'tsr50': round(t50, 1), 'tsr75': round(t75, 1),
                'price50': round(agl_adj0 * (1 + t50 / 100), 2),
                'price75': round(agl_adj0 * (1 + t75 / 100), 2),
            }

        out['periods'][period_start] = {
            'fy': FY_OF.get(period_start, period_start),
            'comparatorSize': len(members),
            'ranked': points[-1]['ranked'] if points else 0,
            'excluded': excluded,
            'targets': targets,
            'series': points,
        }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w') as f:
        json.dump(out, f, indent=2)
    for p, d in out['periods'].items():
        last = d['series'][-1] if d['series'] else {}
        print(f"  {d['fy']} ({p}): {len(d['series'])} pts, {d['ranked']} ranked, "
              f"{len(d['excluded'])} excluded, latest TSR {last.get('tsr')}% pct {last.get('pct')}")
    print(f"→ {OUT_PATH}")


if __name__ == '__main__':
    main()
