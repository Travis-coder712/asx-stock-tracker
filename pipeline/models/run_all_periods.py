"""Run all strategies across rolling 6-month periods.

Each period: re-screen stocks using current fundamentals (screened at buy date),
allocate $5k, track daily value for 6 months. Cumulative performance chains
across periods (reinvest the ending value into the next period's picks).
"""

import sqlite3
import os
import json
import importlib
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data')

PERIODS = [
    {'id': 'H1-2024', 'buy': '2024-01-02', 'end': '2024-06-28', 'label': 'H1 2024'},
    {'id': 'H2-2024', 'buy': '2024-07-01', 'end': '2024-12-31', 'label': 'H2 2024'},
    {'id': 'H1-2025', 'buy': '2025-01-02', 'end': '2025-06-30', 'label': 'H1 2025'},
    {'id': 'H2-2025', 'buy': '2025-07-01', 'end': '2025-12-31', 'label': 'H2 2025'},
    {'id': 'H1-2026', 'buy': '2026-01-02', 'end': '2026-06-30', 'label': 'H1 2026 (current)'},
    {'id': 'H2-2026', 'buy': '2026-07-01', 'end': '2026-12-31', 'label': 'H2 2026 (forward)'},
]

STRATEGY_MODULES = {
    'dividend_income': 'pipeline.models.dividend_income',
    'contrarian_value': 'pipeline.models.contrarian_value',
    'quant_factors': 'pipeline.models.quant_factors',
    'padley_momentum': 'pipeline.models.padley_momentum',
    'damodaran_dcf': 'pipeline.models.damodaran_dcf',
}

INITIAL_BUDGET = 5000.0


def get_price_on_date(conn, ticker, date, direction='ASC'):
    row = conn.execute(
        f"SELECT adj_close FROM price_history WHERE ticker=? AND date>=? ORDER BY date {direction} LIMIT 1",
        (ticker, date)
    ).fetchone()
    return row[0] if row and row[0] else None


def run_strategy_period(conn, strategy_id, mod, buy_date, end_date, budget):
    """Screen stocks and compute period performance for one strategy/period."""

    # Temporarily patch the module's BUY_DATE if it has one
    if hasattr(mod, 'BUY_DATE'):
        original_buy = mod.BUY_DATE
        mod.BUY_DATE = buy_date

    # Screen stocks
    candidates = mod.screen_stocks(conn)

    max_h = getattr(mod, 'MAX_HOLDINGS', 10)
    picks = candidates[:max_h]

    if hasattr(mod, 'BUY_DATE'):
        mod.BUY_DATE = original_buy

    if not picks:
        return {
            'holdings': [],
            'snapshots': [],
            'endValue': budget,
            'returnPct': 0,
        }

    # Allocate
    per_stock = budget / len(picks)
    holdings = []
    for pick in picks:
        ticker = pick['ticker']
        price = get_price_on_date(conn, ticker, buy_date)
        if not price:
            continue
        shares = per_stock / price
        holdings.append({
            'ticker': ticker,
            'name': pick.get('name', ticker),
            'shares': round(shares, 4),
            'buyPrice': round(price, 2),
            'buyDate': buy_date,
            'rationale': pick.get('rationale', ''),
        })

    # Compute daily snapshots
    dates = conn.execute(
        "SELECT DISTINCT date FROM price_history WHERE date >= ? AND date <= ? ORDER BY date",
        (buy_date, end_date)
    ).fetchall()

    snapshots = []
    prev_value = None
    for (date_str,) in dates:
        total = 0
        count = 0
        for h in holdings:
            p = get_price_on_date(conn, h['ticker'], date_str)
            if p:
                # Find exact date match first
                exact = conn.execute(
                    "SELECT adj_close FROM price_history WHERE ticker=? AND date=?",
                    (h['ticker'], date_str)
                ).fetchone()
                if exact and exact[0]:
                    total += h['shares'] * exact[0]
                    count += 1
        if count == 0:
            continue

        daily_ret = round((total - prev_value) / prev_value * 100, 4) if prev_value and prev_value > 0 else None
        snapshots.append({
            'date': date_str,
            'totalValue': round(total, 2),
            'dailyReturn': daily_ret,
        })
        prev_value = total

    end_value = snapshots[-1]['totalValue'] if snapshots else budget
    return_pct = ((end_value - budget) / budget) * 100

    return {
        'holdings': holdings,
        'snapshots': snapshots,
        'endValue': round(end_value, 2),
        'returnPct': round(return_pct, 1),
    }


def main():
    conn = sqlite3.connect(DB_PATH)
    os.makedirs(os.path.join(OUTPUT_DIR, 'periods'), exist_ok=True)

    all_results = {}

    for sid, mod_path in STRATEGY_MODULES.items():
        print(f"\n{'='*60}")
        print(f"Strategy: {sid}")
        print(f"{'='*60}")

        # Import the module
        mod = importlib.import_module(mod_path)

        cumulative_value = INITIAL_BUDGET
        strategy_periods = []

        for period in PERIODS:
            buy_date = period['buy']
            end_date = period['end']

            # Check if buy date has data
            has_data = conn.execute(
                "SELECT 1 FROM price_history WHERE date >= ? LIMIT 1",
                (buy_date,)
            ).fetchone()

            if not has_data:
                print(f"  {period['label']}: no data yet — skipping")
                strategy_periods.append({
                    'period': period,
                    'budget': round(cumulative_value, 2),
                    'holdings': [],
                    'snapshots': [],
                    'endValue': round(cumulative_value, 2),
                    'returnPct': 0,
                    'cumulativeReturn': round(((cumulative_value - INITIAL_BUDGET) / INITIAL_BUDGET) * 100, 1),
                })
                continue

            result = run_strategy_period(conn, sid, mod, buy_date, end_date, cumulative_value)

            cumulative_return = ((result['endValue'] - INITIAL_BUDGET) / INITIAL_BUDGET) * 100

            print(f"  {period['label']}: ${cumulative_value:,.0f} → ${result['endValue']:,.0f} "
                  f"({result['returnPct']:+.1f}% period, {cumulative_return:+.1f}% cumulative) "
                  f"— {len(result['holdings'])} holdings")

            strategy_periods.append({
                'period': period,
                'budget': round(cumulative_value, 2),
                'holdings': result['holdings'],
                'snapshots': result['snapshots'],
                'endValue': result['endValue'],
                'returnPct': result['returnPct'],
                'cumulativeReturn': round(cumulative_return, 1),
            })

            cumulative_value = result['endValue']

        all_results[sid] = {
            'strategyId': sid,
            'periods': strategy_periods,
            'finalValue': round(cumulative_value, 2),
            'totalReturn': round(((cumulative_value - INITIAL_BUDGET) / INITIAL_BUDGET) * 100, 1),
        }

    # Export results
    # 1. Per-strategy period files
    for sid, data in all_results.items():
        path = os.path.join(OUTPUT_DIR, 'periods', f'{sid}.json')
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)

    # 2. Leaderboard summary
    leaderboard = sorted(
        [{'id': sid, 'totalReturn': d['totalReturn'], 'finalValue': d['finalValue'],
          'periods': len([p for p in d['periods'] if p['holdings']])}
         for sid, d in all_results.items()],
        key=lambda x: x['totalReturn'],
        reverse=True
    )
    path = os.path.join(OUTPUT_DIR, 'periods', 'leaderboard.json')
    with open(path, 'w') as f:
        json.dump(leaderboard, f, indent=2)

    # 3. Combined daily series for comparison chart (cumulative value across all periods)
    comparison = {}
    for sid, data in all_results.items():
        series = []
        for p in data['periods']:
            for s in p['snapshots']:
                series.append({'date': s['date'], 'value': s['totalValue']})
        comparison[sid] = series
    path = os.path.join(OUTPUT_DIR, 'periods', 'comparison.json')
    with open(path, 'w') as f:
        json.dump(comparison, f)

    print(f"\n{'='*60}")
    print("LEADERBOARD (cumulative, $5,000 initial)")
    print(f"{'='*60}")
    for i, lb in enumerate(leaderboard, 1):
        print(f"  {i}. {lb['id']:25s} ${lb['finalValue']:>8,.0f}  ({lb['totalReturn']:+.1f}%)")

    conn.close()
    print("\nDone — exported to frontend/public/data/periods/")


if __name__ == '__main__':
    main()
