"""Compute extended hold period performance for each strategy's picks.

For each 6-month period's stock picks, track what happens if you held
for 6, 12, 18, and 24 months instead of rebalancing. Shows whether
the rebalancing strategy adds or destroys value.
"""

import sqlite3
import os
import json
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data', 'periods')

PERIODS = [
    {'id': 'H1-2024', 'buy': '2024-01-02', 'label': 'H1 2024'},
    {'id': 'H2-2024', 'buy': '2024-07-01', 'label': 'H2 2024'},
    {'id': 'H1-2025', 'buy': '2025-01-02', 'label': 'H1 2025'},
    {'id': 'H2-2025', 'buy': '2025-07-01', 'label': 'H2 2025'},
    {'id': 'H1-2026', 'buy': '2026-01-02', 'label': 'H1 2026'},
]

HOLD_MONTHS = [6, 12, 18, 24]

STRATEGIES = [
    'padley_momentum', 'quant_factors', 'dividend_income',
    'contrarian_value', 'damodaran_dcf',
]

STRATEGY_NAMES = {
    'padley_momentum': 'Padley Momentum',
    'quant_factors': 'Quant Factors',
    'dividend_income': 'Dividend Income',
    'damodaran_dcf': 'Damodaran Value',
    'contrarian_value': 'Contrarian Value',
}


def load_period_holdings(strategy_data, period_id):
    """Get the holdings from a strategy's period data."""
    for p in strategy_data.get('periods', []):
        if p['period']['id'] == period_id:
            return p['holdings']
    return []


def compute_value_at_date(conn, holdings, date_str):
    """Compute portfolio value at a given date."""
    total = 0
    count = 0
    for h in holdings:
        row = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? AND date<=? ORDER BY date DESC LIMIT 1",
            (h['ticker'], date_str)
        ).fetchone()
        if row and row[0]:
            total += h['shares'] * row[0]
            count += 1
    return total if count > 0 else None


def main():
    conn = sqlite3.connect(DB_PATH)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Load strategy period data
    strategy_data = {}
    for sid in STRATEGIES:
        path = os.path.join(OUTPUT_DIR, f'{sid}.json')
        if os.path.exists(path):
            with open(path) as f:
                strategy_data[sid] = json.load(f)

    results = {}

    for period in PERIODS:
        period_id = period['id']
        buy_date = period['buy']
        buy_dt = datetime.strptime(buy_date, '%Y-%m-%d')

        print(f"\n{period['label']} picks — extended hold analysis:")

        period_results = {}

        for sid in STRATEGIES:
            if sid not in strategy_data:
                continue

            holdings = load_period_holdings(strategy_data[sid], period_id)
            if not holdings:
                continue

            # Get buy value
            buy_value = sum(h['shares'] * h['buyPrice'] for h in holdings)

            hold_data = []
            for months in HOLD_MONTHS:
                end_dt = buy_dt + relativedelta(months=months)
                end_date = end_dt.strftime('%Y-%m-%d')

                # Check if we have data for this end date
                latest = conn.execute(
                    "SELECT MAX(date) FROM price_history WHERE date <= ?", (end_date,)
                ).fetchone()

                if not latest or not latest[0]:
                    hold_data.append({
                        'months': months,
                        'endDate': None,
                        'value': None,
                        'returnPct': None,
                    })
                    continue

                actual_end = latest[0]
                value = compute_value_at_date(conn, holdings, actual_end)

                if value:
                    ret = ((value - buy_value) / buy_value) * 100
                    hold_data.append({
                        'months': months,
                        'endDate': actual_end,
                        'value': round(value, 2),
                        'returnPct': round(ret, 1),
                    })
                else:
                    hold_data.append({
                        'months': months,
                        'endDate': actual_end,
                        'value': None,
                        'returnPct': None,
                    })

            period_results[sid] = {
                'holdings': [h['ticker'].replace('.AX', '') for h in holdings],
                'buyValue': round(buy_value, 2),
                'holdPeriods': hold_data,
            }

            # Print summary
            returns = [f"{d['months']}m: {d['returnPct']:+.1f}%" if d['returnPct'] is not None
                       else f"{d['months']}m: —" for d in hold_data]
            print(f"  {STRATEGY_NAMES[sid]:25s} {' | '.join(returns)}")

        results[period_id] = {
            'periodId': period_id,
            'label': period['label'],
            'buyDate': buy_date,
            'strategies': period_results,
        }

    # Export
    path = os.path.join(OUTPUT_DIR, 'hold-periods.json')
    with open(path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nExported to {path}")

    conn.close()


if __name__ == '__main__':
    main()
