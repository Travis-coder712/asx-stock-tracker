"""Quantitative Factors strategy — multi-factor stock selection.

Factors (equal-weighted composite score):
- Value: low P/B (rank ascending)
- Momentum: 12-month price return (rank descending)
- Quality: high ROE (rank descending)
- Low volatility: (future — placeholder using P/E stability)

Select top 10 by composite rank, equal-weight $5,000.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
STRATEGY_ID = 'quant_factors'
BUDGET = 5000.0
MAX_HOLDINGS = 10
BUY_DATE = '2024-01-02'


def screen_stocks(conn):
    rows = conn.execute("""
        SELECT f.ticker, s.name, s.sector,
               f.pb_ratio, f.roe, f.pe_ratio, f.eps, f.market_cap, f.dividend_yield
        FROM fundamentals f
        JOIN stocks s ON f.ticker = s.ticker
        WHERE f.ticker LIKE '%.AX'
          AND f.pb_ratio IS NOT NULL AND f.pb_ratio > 0
          AND f.eps IS NOT NULL AND f.eps > 0
        ORDER BY f.date DESC
    """).fetchall()

    seen = set()
    stocks = []
    for r in rows:
        if r[0] in seen:
            continue
        seen.add(r[0])

        ticker = r[0]
        # 12-month momentum: price return from ~12 months ago to buy date
        momentum_start = '2023-01-02'
        p_start = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? AND date>=? ORDER BY date ASC LIMIT 1",
            (ticker, momentum_start)
        ).fetchone()
        p_end = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? AND date>=? ORDER BY date ASC LIMIT 1",
            (ticker, BUY_DATE)
        ).fetchone()

        mom_return = None
        if p_start and p_end and p_start[0] and p_end[0] and p_start[0] > 0:
            mom_return = ((p_end[0] - p_start[0]) / p_start[0]) * 100

        stocks.append({
            'ticker': ticker,
            'name': r[1],
            'sector': r[2],
            'pb': r[3],
            'roe': r[4],
            'pe': r[5],
            'eps': r[6],
            'marketCap': r[7],
            'divYield': r[8],
            'momentum': round(mom_return, 1) if mom_return is not None else None,
        })

    # Filter to stocks with all three factors available
    stocks = [s for s in stocks if s['pb'] and s['roe'] is not None and s['momentum'] is not None]

    # Rank each factor
    n = len(stocks)
    stocks.sort(key=lambda x: x['pb'])
    for i, s in enumerate(stocks):
        s['valueRank'] = i + 1

    stocks.sort(key=lambda x: x['momentum'] or 0, reverse=True)
    for i, s in enumerate(stocks):
        s['momentumRank'] = i + 1

    stocks.sort(key=lambda x: x['roe'] or 0, reverse=True)
    for i, s in enumerate(stocks):
        s['qualityRank'] = i + 1

    # Composite score (lower = better)
    for s in stocks:
        s['compositeRank'] = s['valueRank'] + s['momentumRank'] + s['qualityRank']

    stocks.sort(key=lambda x: x['compositeRank'])
    return stocks


def allocate_and_snapshot(conn, picks):
    conn.execute("DELETE FROM portfolio_holdings WHERE strategy_id=?", (STRATEGY_ID,))
    conn.execute("DELETE FROM portfolio_snapshots WHERE strategy_id=?", (STRATEGY_ID,))
    per_stock = BUDGET / len(picks)

    holdings = []
    for pick in picks:
        ticker = pick['ticker']
        price_row = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? AND date>=? ORDER BY date ASC LIMIT 1",
            (ticker, BUY_DATE)
        ).fetchone()
        if not price_row or not price_row[0]:
            continue
        price = price_row[0]
        shares = per_stock / price

        rationale = 'Value rank %d, Mom rank %d (+%.0f%%), Quality rank %d (ROE %.1f%%), Composite %d' % (
            pick['valueRank'], pick['momentumRank'], pick['momentum'] or 0,
            pick['qualityRank'], (pick['roe'] or 0) * 100, pick['compositeRank']
        )
        conn.execute(
            "INSERT INTO portfolio_holdings (strategy_id, ticker, shares, buy_price, buy_date, rationale) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (STRATEGY_ID, ticker, round(shares, 4), round(price, 2), BUY_DATE, rationale)
        )
        holdings.append((ticker, shares))
    conn.commit()

    # Snapshots
    dates = conn.execute(
        "SELECT DISTINCT date FROM price_history WHERE date >= ? ORDER BY date", (BUY_DATE,)
    ).fetchall()

    prev_value = None
    for (date_str,) in dates:
        total = 0
        count = 0
        for ticker, shares in holdings:
            p = conn.execute(
                "SELECT adj_close FROM price_history WHERE ticker=? AND date=?", (ticker, date_str)
            ).fetchone()
            if p and p[0]:
                total += shares * p[0]
                count += 1
        if count == 0:
            continue
        daily_ret = round((total - prev_value) / prev_value * 100, 4) if prev_value and prev_value > 0 else None
        conn.execute(
            "INSERT OR REPLACE INTO portfolio_snapshots (strategy_id, date, total_value, cash, num_holdings, daily_return) "
            "VALUES (?, ?, ?, 0, ?, ?)",
            (STRATEGY_ID, date_str, round(total, 2), count, daily_ret)
        )
        prev_value = total
    conn.commit()


def main():
    conn = sqlite3.connect(DB_PATH)
    print("Screening for Quantitative Factors...")
    stocks = screen_stocks(conn)
    print(f"  {len(stocks)} stocks scored across 3 factors")

    top = stocks[:MAX_HOLDINGS]
    print(f"\n  Top {len(top)} picks:")
    for i, p in enumerate(top, 1):
        print(f"    {i}. {p['ticker']:10s} Composite {p['compositeRank']:3d}  "
              f"Value#{p['valueRank']} Mom#{p['momentumRank']}({p['momentum']:+.0f}%) "
              f"Qual#{p['qualityRank']}(ROE {(p['roe'] or 0)*100:.0f}%)")

    allocate_and_snapshot(conn, top)

    latest = conn.execute(
        "SELECT date, total_value FROM portfolio_snapshots WHERE strategy_id=? ORDER BY date DESC LIMIT 1",
        (STRATEGY_ID,)
    ).fetchone()
    if latest:
        ret = ((latest[1] - BUDGET) / BUDGET) * 100
        print(f"\n  Latest: ${latest[1]:,.2f} ({ret:+.1f}%) as of {latest[0]}")
    conn.close()


if __name__ == '__main__':
    main()
