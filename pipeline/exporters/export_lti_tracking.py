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
import datetime
import statistics

from pipeline.data.asx100_constituents import PEER_GROUPS, BLOCKED_TICKERS
from pipeline.models.tsr_basis import load_series, vwap as _vwap, day_before

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
OUT_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data', 'tsr', 'lti-tracking.json')

FY_OF = {'2023-07-01': 'FY24', '2024-07-01': 'FY25', '2025-07-01': 'FY26', '2026-07-01': 'FY27'}

# ⚠️ QUB.AX IS DELIBERATELY NOT IN THIS LIST. Qube Holdings was acquired by a
# Macquarie Asset Management-led consortium for $5.20 cash a share (a 27.8%
# premium); the scheme was implemented 14-08-2026 and QUB left the ASX on
# 17-08-2026. Its price series stops at 19-06-2026 with a close of $5.11 —
# within 2% of the cash consideration — so the frozen TSR is a fair measure of
# the realised return, and QUB ranks 8th of 93 in the FY24 group on +93.3%.
#
# Do NOT "tidy" it into EXIT_REASON. It sits ABOVE AGL in every period it
# belongs to, so excluding it would lift AGL's percentile on a technicality
# rather than on performance. A takeover at a premium is a real return to a
# comparator shareholder and the plan measures relative TSR, not survivorship.
#
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
        # ⚠️ THE PLAN MEASURES ON A 30-DAY VWAP, NOT SPOT. FY24 Offer s4.1:
        # "the price of the relevant entity's securities as at 30 June 2023 and
        #  30 June 2027 will be calculated by reference to the VWAP of those
        #  securities sold on the ASX in the thirty calendar days up to and
        #  including 30 June 2023 and 30 June 2027".
        #
        # Until 2026-11-21 this exporter used the spot adj_close on the first
        # trading day of the period and the spot price at each measurement date.
        # That is not the plan's arithmetic and the gap is not small: AGL's
        # 30-day VWAP to 30-06-2023 was $8.57 against a $9.10 spot on 03-07-2023,
        # so FY24's TSR was understated by about 6 points and its percentile by
        # roughly 4. FY27 moved the other way, by 12.
        #
        # The start price is fixed history, so that part of the correction is
        # permanent. Load from 30 days BEFORE the period start so the opening
        # VWAP window is available, and carry volume for the weighting.
        series = {}
        for t in members:
            if t in BLOCKED_TICKERS:
                continue
            sr = load_series(conn, t, period_start)
            if sr:
                series[t] = sr

        def val(t, d, idx):
            s = series.get(t)
            if not s:
                return None
            pos = bisect.bisect_right(s[0], d) - 1
            return s[idx][pos] if pos >= 0 else None

        def vwap30(t, d, idx=1):
            """30-day VWAP for a member — the plan's basis, from models/tsr_basis."""
            return _vwap(series.get(t), d, idx)

        if 'AGL.AX' not in series:
            continue

        # Opening price: the 30-day VWAP to the day BEFORE the period starts,
        # i.e. to 30 June. Computed once — it never changes.
        open_px = {t: vwap30(t, day_before(period_start)) for t in series}

        points = []
        for d in month_ends(period_start, latest):
            # TSR for every member to date d, both ends on the 30-day VWAP
            tsrs = {}
            for t, s in series.items():
                a0 = open_px.get(t)
                an = vwap30(t, d)
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
                'tickers': sorted(tsrs),
            })

        # Account for EVERY member. Previously this only listed names with no
        # rows at all, so a ticker that HAD rows but could not be priced at the
        # period start fell out of both lists — ranked 92 + excluded 7 = 99 of
        # 100, with the missing one named nowhere. ALU.AX did exactly that.
        ranked_set = set(points[-1]['tickers']) if points else set()
        excluded = []
        for t in members:
            if t in ranked_set:
                continue
            code = t.replace('.AX', '')
            if t not in series:
                reason = EXIT_REASON.get(code, 'delisted / no data')
            else:
                reason = EXIT_REASON.get(code, 'no price at period start — not measurable')
            excluded.append({'ticker': code, 'name': names.get(t, code), 'reason': reason})
        # 'tickers' was only needed to reconcile the two lists — it would add
        # ~100 codes to every monthly point if serialised.
        for pt in points:
            pt.pop('tickers', None)

        assert len(ranked_set) + len(excluded) == len(members), (
            f"{period_start}: {len(ranked_set)} ranked + {len(excluded)} excluded "
            f"!= {len(members)} in the comparator")

        # Target prices: what AGL's price would need to be TODAY to sit at the
        # 50th / 75th percentile, holding every other company where it is now.
        # AGL TSR = adj_close_now / adj_close_start - 1, and for the latest date
        # adj_close == raw close (no future dividends), so the implied raw price
        # for a target TSR T is: adj_close_start * (1 + T).
        agl_adj0 = open_px['AGL.AX']
        others = sorted(
            (vwap30(t, latest) / open_px[t] - 1) * 100
            for t in series
            if t != 'AGL.AX' and open_px.get(t) and vwap30(t, latest)
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
