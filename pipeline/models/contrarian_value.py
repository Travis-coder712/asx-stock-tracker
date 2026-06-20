"""Contrarian Deep Value strategy — Graham/Buffett-style value investing.

Criteria:
- P/B < 1.5 (trading near or below book value)
- P/E < 15 (cheap on earnings)
- Current ratio > 1.0 (solvent)
- Positive EPS
- Rank by Graham Number discount (sqrt(22.5 * EPS * BVPS) vs price)
- Select top 10, equal-weight $5,000
"""

import sqlite3
import os
import math
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
STRATEGY_ID = 'contrarian_value'
BUDGET = 5000.0
MAX_HOLDINGS = 10
BUY_DATE = '2024-01-02'


def screen_stocks(conn):
    rows = conn.execute("""
        SELECT
            f.ticker, s.name, s.sector,
            f.pe_ratio, f.pb_ratio, f.eps, f.book_value,
            f.current_ratio, f.market_cap, f.dividend_yield
        FROM fundamentals f
        JOIN stocks s ON f.ticker = s.ticker
        WHERE f.ticker LIKE '%.AX'
          AND f.eps IS NOT NULL AND f.eps > 0
          AND f.pe_ratio IS NOT NULL AND f.pe_ratio > 0 AND f.pe_ratio < 15
          AND f.pb_ratio IS NOT NULL AND f.pb_ratio > 0 AND f.pb_ratio < 1.5
        ORDER BY f.date DESC
    """).fetchall()

    seen = set()
    candidates = []
    for r in rows:
        ticker = r[0]
        if ticker in seen:
            continue
        seen.add(ticker)

        eps = r[5]
        bvps = r[6]
        pe = r[3]
        pb = r[4]
        current_ratio = r[7]

        if current_ratio is not None and current_ratio < 1.0:
            continue

        graham_number = math.sqrt(22.5 * eps * bvps) if bvps and bvps > 0 else None

        latest_price = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? AND date>=? ORDER BY date ASC LIMIT 1",
            (ticker, BUY_DATE)
        ).fetchone()
        price = latest_price[0] if latest_price else None

        discount = None
        if graham_number and price and price > 0:
            discount = ((graham_number - price) / price) * 100

        candidates.append({
            'ticker': ticker,
            'name': r[1],
            'sector': r[2],
            'pe': round(pe, 1),
            'pb': round(pb, 2),
            'eps': round(eps, 2),
            'bvps': round(bvps, 2) if bvps else None,
            'currentRatio': round(current_ratio, 2) if current_ratio else None,
            'grahamNumber': round(graham_number, 2) if graham_number else None,
            'price': round(price, 2) if price else None,
            'grahamDiscount': round(discount, 1) if discount is not None else None,
            'divYield': round(r[9] * 100, 2) if r[9] and r[9] < 1 else round(r[9], 2) if r[9] else None,
        })

    candidates.sort(key=lambda x: x.get('grahamDiscount') or -999, reverse=True)
    return candidates


def allocate_portfolio(conn, picks):
    conn.execute("DELETE FROM portfolio_holdings WHERE strategy_id=?", (STRATEGY_ID,))
    per_stock = BUDGET / len(picks)

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

        rationale = 'P/E %s, P/B %s, EPS $%s' % (pick['pe'], pick['pb'], pick['eps'])
        if pick['grahamDiscount'] is not None:
            rationale += ', Graham discount %s%%' % pick['grahamDiscount']

        conn.execute(
            "INSERT INTO portfolio_holdings (strategy_id, ticker, shares, buy_price, buy_date, rationale) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (STRATEGY_ID, ticker, round(shares, 4), round(price, 2), BUY_DATE, rationale)
        )
    conn.commit()


def compute_snapshots(conn):
    holdings = conn.execute(
        "SELECT ticker, shares FROM portfolio_holdings WHERE strategy_id=?",
        (STRATEGY_ID,)
    ).fetchall()
    if not holdings:
        return

    dates = conn.execute(
        "SELECT DISTINCT date FROM price_history WHERE date >= ? ORDER BY date",
        (BUY_DATE,)
    ).fetchall()

    conn.execute("DELETE FROM portfolio_snapshots WHERE strategy_id=?", (STRATEGY_ID,))

    prev_value = None
    for (date_str,) in dates:
        total = 0
        count = 0
        for ticker, shares in holdings:
            p = conn.execute(
                "SELECT adj_close FROM price_history WHERE ticker=? AND date=?",
                (ticker, date_str)
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
    print("Screening for Contrarian Deep Value...")
    candidates = screen_stocks(conn)
    print(f"  {len(candidates)} stocks pass filters")

    top = candidates[:MAX_HOLDINGS]
    if not top:
        print("  No stocks pass all filters — relaxing P/B to < 2.0")
        # Relax and re-query
        rows = conn.execute("""
            SELECT f.ticker, s.name, f.pe_ratio, f.pb_ratio, f.eps, f.book_value, f.current_ratio
            FROM fundamentals f JOIN stocks s ON f.ticker = s.ticker
            WHERE f.ticker LIKE '%.AX' AND f.eps > 0 AND f.pe_ratio > 0 AND f.pe_ratio < 20
              AND f.pb_ratio > 0 AND f.pb_ratio < 2.0
            ORDER BY f.pb_ratio ASC
        """).fetchall()
        seen = set()
        for r in rows:
            if r[0] in seen:
                continue
            seen.add(r[0])
            top.append({'ticker': r[0], 'name': r[1], 'pe': r[2], 'pb': r[3],
                        'eps': r[4], 'bvps': r[5], 'currentRatio': r[6],
                        'grahamDiscount': None})
            if len(top) >= MAX_HOLDINGS:
                break

    print(f"\n  Top {len(top)} picks:")
    for i, p in enumerate(top, 1):
        gd = '%+.0f%%' % p['grahamDiscount'] if p.get('grahamDiscount') is not None else '?'
        print(f"    {i}. {p['ticker']:10s} P/E {p['pe']:5.1f}  P/B {p['pb']:4.2f}  Graham disc: {gd}")

    allocate_portfolio(conn, top)
    print("  Computing snapshots...")
    compute_snapshots(conn)

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
