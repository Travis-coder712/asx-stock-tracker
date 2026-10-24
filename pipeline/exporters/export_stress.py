"""Correction stress-test data.

For each strategy, measures its sensitivity to the ASX 100 (beta) and its worst
actual drawdown in the tracked history, plus today's exposure to the three
scenario risks a correction tends to hit (rates, commodities, cyclical/AI-beta).
Also emits the live 200-day-MA risk-off signal (Padley's circuit breaker).

Emits frontend/public/data/risk/stress-test.json. The frontend applies a
hypothetical index shock interactively (beta-implied), so no shock is baked in.
"""

import os
import json
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
OUT_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data', 'risk', 'stress-test.json')
INDEX = '^ATOI'
START = '2024-01-02'

STRATEGIES = {
    'padley_momentum': 'Padley Momentum',
    'quant_factors': 'Quant Factors',
    'dividend_income': 'Dividend Income',
    'damodaran_dcf': 'Damodaran Value',
    'contrarian_value': 'Contrarian Value',
}

# sector -> scenario risk bucket
BUCKET = {
    'Financial Services': 'rates', 'Real Estate': 'rates',
    'Basic Materials': 'commodity', 'Energy': 'commodity',
    'Technology': 'cyclical', 'Consumer Cyclical': 'cyclical',
    'Communication Services': 'cyclical', 'Industrials': 'cyclical',
    'Healthcare': 'defensive', 'Consumer Defensive': 'defensive', 'Utilities': 'defensive',
}


def daily_returns(rows):
    out = {}
    for (d0, v0), (d1, v1) in zip(rows, rows[1:]):
        if v0:
            out[d1] = v1 / v0 - 1.0
    return out


def beta(strat_r, idx_r):
    common = [d for d in strat_r if d in idx_r]
    if len(common) < 10:
        return None
    xs = [idx_r[d] for d in common]
    ys = [strat_r[d] for d in common]
    mx = sum(xs) / len(xs)
    my = sum(ys) / len(ys)
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / len(xs)
    var = sum((x - mx) ** 2 for x in xs) / len(xs)
    return round(cov / var, 2) if var else None


def max_drawdown(rows):
    peak = None
    mdd = 0.0
    for _, v in rows:
        if peak is None or v > peak:
            peak = v
        if peak:
            mdd = min(mdd, (v - peak) / peak)
    return round(mdd * 100, 1)


def main():
    conn = sqlite3.connect(DB_PATH)

    idx_rows = conn.execute(
        "SELECT date, adj_close FROM price_history WHERE ticker=? AND date>=? AND adj_close IS NOT NULL ORDER BY date",
        (INDEX, START)).fetchall()
    idx_r = daily_returns(idx_rows)
    index_dd = max_drawdown(idx_rows)

    # 200-day MA risk-off signal (latest)
    last200 = conn.execute(
        "SELECT adj_close FROM price_history WHERE ticker=? AND adj_close IS NOT NULL ORDER BY date DESC LIMIT 200",
        (INDEX,)).fetchall()
    cur = last200[0][0]
    ma200 = sum(r[0] for r in last200) / len(last200)
    latest_date = conn.execute("SELECT MAX(date) FROM price_history WHERE ticker=?", (INDEX,)).fetchone()[0]

    strategies = []
    for sid, name in STRATEGIES.items():
        snaps = conn.execute(
            "SELECT date, total_value FROM portfolio_snapshots WHERE strategy_id=? AND date>=? ORDER BY date",
            (sid, START)).fetchall()
        if not snaps:
            continue
        b = beta(daily_returns(snaps), idx_r)
        mdd = max_drawdown(snaps)
        current = snaps[-1][1]

        buckets = {'rates': 0, 'commodity': 0, 'cyclical': 0, 'defensive': 0, 'other': 0}
        holds = conn.execute("SELECT ticker FROM portfolio_holdings WHERE strategy_id=?", (sid,)).fetchall()
        for (t,) in holds:
            sec = conn.execute("SELECT sector FROM stocks WHERE ticker=?", (t,)).fetchone()
            sec = sec[0] if sec and sec[0] else None
            buckets[BUCKET.get(sec, 'other')] += 1
        n = max(1, len(holds))

        strategies.append({
            'id': sid, 'name': name,
            'beta': b, 'maxDrawdown': mdd, 'currentValue': round(current, 2),
            'holdings': len(holds),
            'exposure': {k: round(v / n * 100) for k, v in buckets.items()},
        })

    strategies.sort(key=lambda s: -(s['beta'] or 0))

    payload = {
        'asOf': latest_date,
        'index': {
            'name': 'ASX 100',
            'maxDrawdown': index_dd,
            'current': round(cur, 1),
            'ma200': round(ma200, 1),
            'pctVsMa200': round((cur / ma200 - 1) * 100, 1),
            'riskOff': cur < ma200,
        },
        'strategies': strategies,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w') as f:
        json.dump(payload, f, indent=2)
    print(f"Exported stress-test for {len(strategies)} strategies → {OUT_PATH}")
    print(f"  index {payload['index']['current']} vs 200MA {payload['index']['ma200']} "
          f"({payload['index']['pctVsMa200']:+.1f}%) — {'RISK-OFF' if payload['index']['riskOff'] else 'risk-on'}")


if __name__ == '__main__':
    main()
