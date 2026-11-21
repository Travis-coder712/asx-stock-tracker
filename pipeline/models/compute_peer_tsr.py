"""Compute TSR for all ASX 100 peers and rank AGL within the group."""

import sqlite3
import os
import json
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from data.asx100_constituents import PEER_GROUPS, BLOCKED_TICKERS
from models.tsr_basis import load_series, tsr_pct

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data', 'tsr')


def compute_peer_ranking(conn, period_start):
    peers = PEER_GROUPS.get(period_start, [])
    if not peers:
        print(f"  No peer group defined for {period_start}")
        return None

    # ⚠️ Measured on the plan's 30-day VWAP basis via models/tsr_basis, NOT on
    # spot prices and NOT via the tsr_tracking table. Until 2026-11-21 this
    # used spot endpoints, which moved AGL's FY27 percentile by 12 points and
    # FY24's by 4. The LTI page reads its percentiles from the files this
    # script writes, so this is the one that actually reaches the user.
    latest = conn.execute("SELECT MAX(date) FROM price_history").fetchone()[0]

    rankings = []
    for ticker in peers:
        if ticker in BLOCKED_TICKERS:
            continue
        series = load_series(conn, ticker, period_start)
        t = tsr_pct(series, period_start, latest) if series else None
        if t is None:
            continue
        name_row = conn.execute(
            "SELECT name FROM stocks WHERE ticker=?", (ticker,)
        ).fetchone()
        rankings.append({
            'ticker': ticker,
            'name': name_row[0] if name_row else ticker.replace('.AX', ''),
            'tsrPct': t,
        })

    rankings.sort(key=lambda x: x['tsrPct'], reverse=True)

    for i, r in enumerate(rankings):
        r['rank'] = i + 1
        r['percentile'] = round((1 - i / (len(rankings) - 1)) * 100, 1) if len(rankings) > 1 else 50

    agl = next((r for r in rankings if r['ticker'] == 'AGL.AX'), None)

    result = {
        'periodStart': period_start,
        'peerCount': len(peers),
        'rankedCount': len(rankings),
        'excludedCount': len(peers) - len(rankings),
        'aglRank': agl['rank'] if agl else None,
        'aglTsr': agl['tsrPct'] if agl else None,
        'aglPercentile': agl['percentile'] if agl else None,
        'median': rankings[len(rankings) // 2]['tsrPct'] if rankings else None,
        'top': rankings[0] if rankings else None,
        'bottom': rankings[-1] if rankings else None,
        'rankings': rankings,
    }

    return result


def main():
    conn = sqlite3.connect(DB_PATH)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    all_results = []

    for period_start in PEER_GROUPS:
        print(f"\nPeer TSR ranking for period starting {period_start}...")
        result = compute_peer_ranking(conn, period_start)
        if not result:
            continue

        all_results.append(result)

        path = os.path.join(OUTPUT_DIR, f'peer-ranking-{period_start}.json')
        with open(path, 'w') as f:
            json.dump(result, f, indent=2)

        print(f"  {result['rankedCount']} of {result['peerCount']} peers ranked "
              f"({result['excludedCount']} excluded — delisted/no data)")
        if result['aglRank']:
            print(f"  AGL rank: {result['aglRank']} of {result['rankedCount']} "
                  f"(percentile: {result['aglPercentile']})")
            print(f"  AGL TSR: {result['aglTsr']:+.1f}%  |  "
                  f"Median: {result['median']:+.1f}%  |  "
                  f"Top: {result['top']['ticker']} {result['top']['tsrPct']:+.1f}%  |  "
                  f"Bottom: {result['bottom']['ticker']} {result['bottom']['tsrPct']:+.1f}%")

        print(f"\n  Top 10:")
        for r in result['rankings'][:10]:
            marker = ' ◄ AGL' if r['ticker'] == 'AGL.AX' else ''
            print(f"    {r['rank']:3d}. {r['ticker']:10s} {r['tsrPct']:+7.1f}%{marker}")

        agl_idx = next((i for i, r in enumerate(result['rankings']) if r['ticker'] == 'AGL.AX'), None)
        if agl_idx is not None and agl_idx >= 10:
            print(f"    ...")
            start = max(agl_idx - 2, 10)
            for r in result['rankings'][start:agl_idx + 3]:
                marker = ' ◄ AGL' if r['ticker'] == 'AGL.AX' else ''
                print(f"    {r['rank']:3d}. {r['ticker']:10s} {r['tsrPct']:+7.1f}%{marker}")

    conn.close()
    print("\nDone.")


if __name__ == '__main__':
    main()
