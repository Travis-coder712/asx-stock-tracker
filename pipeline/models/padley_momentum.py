"""Padley Momentum strategy — trend-following with capital preservation.

Criteria:
- Positive EPS (profitable)
- ROE > 10% (quality filter)
- 12-month price return > 0 (in an uptrend)
- Market cap > $1B (larger caps only)
- Rank by 12-month momentum (highest first)
- Risk-off: if ASX 200 (^AXJO) is below its 200-day MA, go 100% cash
- Select top 10, equal-weight $5,000
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
STRATEGY_ID = 'padley_momentum'
BUDGET = 5000.0
MAX_HOLDINGS = 10
BUY_DATE = '2024-01-02'


def check_risk_off(conn):
    """Check if ASX 200 is below its 200-day MA (risk-off signal)."""
    prices = conn.execute(
        "SELECT adj_close FROM price_history WHERE ticker='^ATOI' AND date<=? ORDER BY date DESC LIMIT 200",
        (BUY_DATE,)
    ).fetchall()
    if len(prices) < 200:
        return False
    ma200 = sum(p[0] for p in prices if p[0]) / len([p for p in prices if p[0]])
    current = prices[0][0]
    below = current < ma200
    print(f"  ASX 100 at {current:.0f}, 200-day MA at {ma200:.0f} — {'RISK OFF (below MA)' if below else 'RISK ON'}")
    return below


def screen_stocks(conn):
    rows = conn.execute("""
        SELECT f.ticker, s.name, s.sector,
               f.roe, f.eps, f.pe_ratio, f.market_cap, f.dividend_yield
        FROM fundamentals f
        JOIN stocks s ON f.ticker = s.ticker
        WHERE f.ticker LIKE '%.AX'
          AND f.eps IS NOT NULL AND f.eps > 0
          AND f.roe IS NOT NULL AND f.roe > 0.10
          AND f.market_cap IS NOT NULL AND f.market_cap > 1000000000
        ORDER BY f.date DESC
    """).fetchall()

    seen = set()
    candidates = []
    for r in rows:
        if r[0] in seen:
            continue
        seen.add(r[0])

        ticker = r[0]
        momentum_start = '2023-01-02'
        p_start = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? AND date>=? ORDER BY date ASC LIMIT 1",
            (ticker, momentum_start)
        ).fetchone()
        p_end = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? AND date>=? ORDER BY date ASC LIMIT 1",
            (ticker, BUY_DATE)
        ).fetchone()

        if not p_start or not p_end or not p_start[0] or not p_end[0] or p_start[0] <= 0:
            continue

        mom_return = ((p_end[0] - p_start[0]) / p_start[0]) * 100
        if mom_return <= 0:
            continue

        candidates.append({
            'ticker': ticker,
            'name': r[1],
            'sector': r[2],
            'roe': round(r[3] * 100, 1) if r[3] else None,
            'eps': round(r[4], 2),
            'pe': round(r[5], 1) if r[5] else None,
            'marketCap': r[6],
            'momentum': round(mom_return, 1),
            'divYield': r[7],
        })

    candidates.sort(key=lambda x: x['momentum'], reverse=True)
    return candidates


def allocate_and_snapshot(conn, picks):
    conn.execute("DELETE FROM portfolio_holdings WHERE strategy_id=?", (STRATEGY_ID,))
    conn.execute("DELETE FROM portfolio_snapshots WHERE strategy_id=?", (STRATEGY_ID,))

    if not picks:
        print("  RISK OFF — portfolio is 100% cash")
        conn.execute(
            "INSERT INTO portfolio_snapshots (strategy_id, date, total_value, cash, num_holdings) "
            "VALUES (?, ?, ?, ?, 0)",
            (STRATEGY_ID, BUY_DATE, BUDGET, BUDGET)
        )
        conn.commit()
        return

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

        rationale = 'Mom +%.0f%%, ROE %.0f%%, EPS $%s, P/E %s' % (
            pick['momentum'], pick['roe'] or 0, pick['eps'], pick['pe'] or '?'
        )
        conn.execute(
            "INSERT INTO portfolio_holdings (strategy_id, ticker, shares, buy_price, buy_date, rationale) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (STRATEGY_ID, ticker, round(shares, 4), round(price, 2), BUY_DATE, rationale)
        )
        holdings.append((ticker, shares))
    conn.commit()

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
    print("Padley Momentum strategy...")

    risk_off = check_risk_off(conn)

    if risk_off:
        print("  RISK OFF — would go 100% cash")
        allocate_and_snapshot(conn, [])
    else:
        candidates = screen_stocks(conn)
        print(f"  {len(candidates)} stocks pass filters (positive momentum, ROE>10%, cap>$1B)")

        top = candidates[:MAX_HOLDINGS]
        print(f"\n  Top {len(top)} picks:")
        for i, p in enumerate(top, 1):
            print(f"    {i}. {p['ticker']:10s} Mom {p['momentum']:+6.1f}%  ROE {p['roe']:5.1f}%  P/E {p['pe'] or '?'}")

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
