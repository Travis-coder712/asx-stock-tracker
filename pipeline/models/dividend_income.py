"""Dividend Income strategy — screen ASX stocks for high-yield income portfolio.

Criteria:
- Dividend yield > 0 (must pay dividends)
- Payout ratio < 80% (sustainable)
- Positive earnings (EPS > 0)
- Rank by dividend yield (descending)
- Select top 10, equal-weight $5,000
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
STRATEGY_ID = 'dividend_income'
BUDGET = 5000.0
MAX_HOLDINGS = 10


def screen_stocks(conn: sqlite3.Connection) -> list:
    """Screen ASX stocks for dividend income criteria."""
    rows = conn.execute("""
        SELECT
            f.ticker,
            s.name,
            s.sector,
            f.dividend_yield,
            f.payout_ratio,
            f.eps,
            f.pe_ratio,
            f.market_cap,
            f.free_cash_flow,
            f.current_ratio
        FROM fundamentals f
        JOIN stocks s ON f.ticker = s.ticker
        WHERE f.ticker LIKE '%.AX'
          AND f.dividend_yield IS NOT NULL
          AND f.dividend_yield > 0
          AND f.eps IS NOT NULL
          AND f.eps > 0
        ORDER BY f.date DESC
    """).fetchall()

    seen = set()
    candidates = []
    for r in rows:
        ticker = r[0]
        if ticker in seen:
            continue
        seen.add(ticker)

        div_yield = r[3]
        payout = r[4]
        eps = r[5]

        if payout is not None and payout > 0.80:
            continue

        candidates.append({
            'ticker': ticker,
            'name': r[1],
            'sector': r[2],
            'divYield': round(div_yield, 2) if div_yield else 0,
            'payoutRatio': round(payout * 100, 1) if payout else None,
            'eps': round(eps, 2) if eps else None,
            'pe': round(r[6], 1) if r[6] else None,
            'marketCap': r[7],
            'fcf': r[8],
            'currentRatio': round(r[9], 2) if r[9] else None,
        })

    candidates.sort(key=lambda x: x['divYield'], reverse=True)
    return candidates


def allocate_portfolio(conn: sqlite3.Connection, picks: list,
                       buy_date: str = '2024-01-02') -> None:
    """Allocate $5,000 equally across top picks and record holdings."""

    conn.execute(
        "DELETE FROM portfolio_holdings WHERE strategy_id=?",
        (STRATEGY_ID,)
    )

    per_stock = BUDGET / len(picks)

    for pick in picks:
        ticker = pick['ticker']
        latest_price = conn.execute(
            "SELECT adj_close FROM price_history "
            "WHERE ticker=? AND date>=? ORDER BY date ASC LIMIT 1",
            (ticker, buy_date)
        ).fetchone()

        if not latest_price or not latest_price[0]:
            continue

        price = latest_price[0]
        shares = per_stock / price

        payout_str = ', payout %s%%' % pick['payoutRatio'] if pick['payoutRatio'] else ''
        pe_str = ', P/E %s' % pick['pe'] if pick['pe'] else ''
        rationale = 'Div yield %s%%%s, EPS $%s%s' % (
            pick['divYield'], payout_str, pick['eps'], pe_str
        )

        conn.execute(
            "INSERT INTO portfolio_holdings "
            "(strategy_id, ticker, shares, buy_price, buy_date, rationale) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (STRATEGY_ID, ticker, round(shares, 4), round(price, 2), buy_date, rationale)
        )

    conn.commit()


def compute_snapshots(conn: sqlite3.Connection) -> None:
    """Compute daily portfolio value snapshots from buy date to latest."""
    holdings = conn.execute(
        "SELECT ticker, shares, buy_price, buy_date FROM portfolio_holdings "
        "WHERE strategy_id=?",
        (STRATEGY_ID,)
    ).fetchall()

    if not holdings:
        return

    buy_date = holdings[0][3]

    dates = conn.execute(
        "SELECT DISTINCT date FROM price_history "
        "WHERE date >= ? ORDER BY date",
        (buy_date,)
    ).fetchall()

    conn.execute(
        "DELETE FROM portfolio_snapshots WHERE strategy_id=?",
        (STRATEGY_ID,)
    )

    prev_value = None
    for (date_str,) in dates:
        total = 0
        count = 0
        for ticker, shares, _, _ in holdings:
            price_row = conn.execute(
                "SELECT adj_close FROM price_history "
                "WHERE ticker=? AND date=?",
                (ticker, date_str)
            ).fetchone()
            if price_row and price_row[0]:
                total += shares * price_row[0]
                count += 1

        if count == 0:
            continue

        daily_ret = None
        if prev_value and prev_value > 0:
            daily_ret = round((total - prev_value) / prev_value * 100, 4)

        conn.execute(
            "INSERT OR REPLACE INTO portfolio_snapshots "
            "(strategy_id, date, total_value, cash, num_holdings, daily_return) "
            "VALUES (?, ?, ?, 0, ?, ?)",
            (STRATEGY_ID, date_str, round(total, 2), count, daily_ret)
        )
        prev_value = total

    conn.commit()


def main():
    conn = sqlite3.connect(DB_PATH)

    print("Screening ASX stocks for Dividend Income strategy...")
    candidates = screen_stocks(conn)
    print(f"  {len(candidates)} stocks pass filters")

    top = candidates[:MAX_HOLDINGS]
    print(f"\n  Top {len(top)} picks:")
    for i, p in enumerate(top, 1):
        print(f"    {i}. {p['ticker']:10s} {p['name'][:30]:30s}  "
              f"Yield {p['divYield']:5.1f}%  "
              f"Payout {p['payoutRatio'] or '?':>5}%  "
              f"EPS ${p['eps']}")

    print(f"\n  Allocating ${BUDGET:,.0f} across {len(top)} stocks...")
    allocate_portfolio(conn, top)

    print("  Computing daily snapshots...")
    compute_snapshots(conn)

    latest = conn.execute(
        "SELECT date, total_value FROM portfolio_snapshots "
        "WHERE strategy_id=? ORDER BY date DESC LIMIT 1",
        (STRATEGY_ID,)
    ).fetchone()
    if latest:
        ret = ((latest[1] - BUDGET) / BUDGET) * 100
        print(f"\n  Latest value: ${latest[1]:,.2f} ({ret:+.1f}%) as of {latest[0]}")

    conn.close()
    print("\nDone.")


if __name__ == '__main__':
    main()
