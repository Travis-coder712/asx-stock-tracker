"""Damodaran Intrinsic Value strategy — simplified DCF + relative valuation.

Since full DCF requires revenue projections and WACC estimates beyond what
yfinance provides, this uses a simplified "relative value" approach inspired
by Damodaran's principles:
- Compare P/E to sector median (cheap vs sector = undervalued)
- Compare P/B to sector median
- FCF yield (FCF / market cap) — higher = more cash generation per dollar
- Positive earnings and cash flow required
- Rank by composite "value gap" — how cheap vs sector peers
- Select top 10, equal-weight $5,000
"""

import sqlite3
import os
from collections import defaultdict

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
STRATEGY_ID = 'damodaran_dcf'
BUDGET = 5000.0
MAX_HOLDINGS = 10
BUY_DATE = '2024-01-02'


def screen_stocks(conn):
    rows = conn.execute("""
        SELECT f.ticker, s.name, s.sector,
               f.pe_ratio, f.pb_ratio, f.eps, f.free_cash_flow,
               f.market_cap, f.roe, f.dividend_yield, f.revenue
        FROM fundamentals f
        JOIN stocks s ON f.ticker = s.ticker
        WHERE f.ticker LIKE '%.AX'
          AND f.eps IS NOT NULL AND f.eps > 0
          AND f.pe_ratio IS NOT NULL AND f.pe_ratio > 0
          AND f.market_cap IS NOT NULL AND f.market_cap > 0
        ORDER BY f.date DESC
    """).fetchall()

    seen = set()
    stocks = []
    for r in rows:
        if r[0] in seen:
            continue
        seen.add(r[0])

        fcf = r[6]
        mcap = r[7]
        fcf_yield = (fcf / mcap * 100) if fcf and mcap and mcap > 0 else None

        stocks.append({
            'ticker': r[0],
            'name': r[1],
            'sector': r[2] or 'Unknown',
            'pe': r[3],
            'pb': r[4],
            'eps': r[5],
            'fcf': fcf,
            'marketCap': mcap,
            'roe': r[8],
            'divYield': r[9],
            'fcfYield': round(fcf_yield, 2) if fcf_yield is not None else None,
        })

    # Compute sector medians
    sector_pe = defaultdict(list)
    sector_pb = defaultdict(list)
    for s in stocks:
        if s['pe'] and s['pe'] > 0:
            sector_pe[s['sector']].append(s['pe'])
        if s['pb'] and s['pb'] > 0:
            sector_pb[s['sector']].append(s['pb'])

    def median(lst):
        if not lst:
            return None
        lst = sorted(lst)
        n = len(lst)
        return lst[n // 2] if n % 2 else (lst[n // 2 - 1] + lst[n // 2]) / 2

    sector_pe_med = {k: median(v) for k, v in sector_pe.items()}
    sector_pb_med = {k: median(v) for k, v in sector_pb.items()}

    # Score each stock: how cheap vs sector
    for s in stocks:
        pe_med = sector_pe_med.get(s['sector'])
        pb_med = sector_pb_med.get(s['sector'])

        pe_discount = ((pe_med - s['pe']) / pe_med * 100) if pe_med and s['pe'] else 0
        pb_discount = ((pb_med - (s['pb'] or 0)) / pb_med * 100) if pb_med and s['pb'] else 0
        fcf_score = s['fcfYield'] or 0

        # Composite: weight P/E discount 40%, P/B discount 30%, FCF yield 30%
        s['valueScore'] = round(pe_discount * 0.4 + pb_discount * 0.3 + fcf_score * 0.3, 2)
        s['peDiscount'] = round(pe_discount, 1)
        s['pbDiscount'] = round(pb_discount, 1)
        s['sectorPeMedian'] = round(pe_med, 1) if pe_med else None
        s['sectorPbMedian'] = round(pb_med, 2) if pb_med else None

    stocks.sort(key=lambda x: x['valueScore'], reverse=True)
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

        rationale = 'P/E %s (sector med %s, %+.0f%%), FCF yield %s%%' % (
            round(pick['pe'], 1), pick['sectorPeMedian'] or '?',
            pick['peDiscount'], pick['fcfYield'] or '?'
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
    print("Damodaran Intrinsic Value (relative valuation)...")
    stocks = screen_stocks(conn)
    print(f"  {len(stocks)} stocks scored by sector-relative value")

    top = stocks[:MAX_HOLDINGS]
    print(f"\n  Top {len(top)} picks:")
    for i, p in enumerate(top, 1):
        print(f"    {i}. {p['ticker']:10s} Score {p['valueScore']:+6.1f}  "
              f"P/E {p['pe']:.1f} (sect med {p['sectorPeMedian'] or '?'})  "
              f"FCF yield {p['fcfYield'] or '?'}%")

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
