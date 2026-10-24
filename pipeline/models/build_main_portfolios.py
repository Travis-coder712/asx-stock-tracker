"""Rebuild the main buy-and-hold portfolios from FROZEN picks.

Replaces re-running the five strategy modules on a refresh. The modules still
exist for first-time screening, but once a portfolio is frozen we only ever
re-price it forward — so the "since 2024" numbers stay stable across refreshes.

Valuation forward-fills each holding's last known adj_close, so a holding that
didn't trade on a given day (or a thinly-traded name) is never silently dropped
from the snapshot — the bug that made a stale ticker read as a -14% "crash".
"""

import os
import sqlite3
from datetime import date

from pipeline.models import freeze

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
BUDGET = 5000.0
STRATEGIES = ['padley_momentum', 'damodaran_dcf', 'quant_factors', 'dividend_income', 'contrarian_value']


def price_series(conn, ticker):
    """date -> adj_close for a ticker, ascending."""
    return conn.execute(
        "SELECT date, adj_close FROM price_history WHERE ticker=? AND adj_close IS NOT NULL ORDER BY date",
        (ticker,)).fetchall()


def build(conn, sid):
    frozen = freeze.get_frozen(conn, sid, 'main')
    if not frozen:
        print(f"  {sid}: no frozen 'main' picks — skip (run the strategy module once to seed)")
        return

    # Rebuild holdings from the frozen set. Derive buy price from the CURRENT
    # adj_close series (not the stored price) so the buy price and the forward
    # valuation sit on one consistent total-return basis — otherwise dividend
    # payers read low because adj_close is re-based on every refresh.
    conn.execute("DELETE FROM portfolio_holdings WHERE strategy_id=?", (sid,))
    per_stock = BUDGET / len(frozen)
    holdings = []
    for h in frozen:
        bd = h.get('buyDate')
        row = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? AND date>=? AND adj_close IS NOT NULL "
            "ORDER BY date LIMIT 1", (h['ticker'], bd)).fetchone()
        if not row:
            print(f"    {h['ticker']}: no price at/after {bd} — skipped")
            continue
        buy_price = row[0]
        shares = per_stock / buy_price
        conn.execute(
            "INSERT INTO portfolio_holdings "
            "(strategy_id, ticker, shares, buy_price, buy_date, rationale) VALUES (?,?,?,?,?,?)",
            (sid, h['ticker'], round(shares, 4), round(buy_price, 2), bd, h.get('rationale')))
        holdings.append({'ticker': h['ticker'], 'shares': shares, 'buyPrice': buy_price})

    # Pre-load each holding's series and a pointer for forward-fill
    series = {h['ticker']: price_series(conn, h['ticker']) for h in holdings}
    buy_date = min(h.get('buyDate') for h in frozen if h.get('buyDate'))

    all_dates = [r[0] for r in conn.execute(
        "SELECT DISTINCT date FROM price_history WHERE date >= ? ORDER BY date", (buy_date,)).fetchall()]

    # Forward-fill valuation
    conn.execute("DELETE FROM portfolio_snapshots WHERE strategy_id=?", (sid,))
    ptr = {t: 0 for t in series}
    last = {h['ticker']: h['buyPrice'] for h in holdings}  # value at cost until first real tick
    prev_value = None
    for d in all_dates:
        for t, ser in series.items():
            while ptr[t] < len(ser) and ser[ptr[t]][0] <= d:
                last[t] = ser[ptr[t]][1]
                ptr[t] += 1
        total = sum(h['shares'] * last[h['ticker']] for h in holdings if last[h['ticker']] is not None)
        if total <= 0:
            continue
        daily_ret = round((total - prev_value) / prev_value * 100, 4) if prev_value else None
        conn.execute(
            "INSERT OR REPLACE INTO portfolio_snapshots "
            "(strategy_id, date, total_value, cash, num_holdings, daily_return) VALUES (?,?,?,?,?,?)",
            (sid, d, round(total, 2), 0, len(holdings), daily_ret))
        prev_value = total
    conn.commit()

    latest = conn.execute(
        "SELECT date, total_value FROM portfolio_snapshots WHERE strategy_id=? ORDER BY date DESC LIMIT 1",
        (sid,)).fetchone()
    ret = (latest[1] - BUDGET) / BUDGET * 100
    print(f"  {sid:20s} ${latest[1]:,.0f} ({ret:+.1f}%) as of {latest[0]} — {len(holdings)} frozen holdings")


def main():
    conn = sqlite3.connect(DB_PATH)
    n = freeze.seed_if_empty(conn)
    if n:
        print(f"Seeded {n} frozen picks from committed originals.")
    # Archive a dated fundamentals snapshot so future first-time screens can be
    # point-in-time rather than using whatever is current at refresh.
    snap = freeze.snapshot_fundamentals(conn, date.today().isoformat())
    print(f"Archived fundamentals snapshot for {snap} tickers.")
    print("Rebuilding main portfolios from frozen picks (re-price forward only):")
    for sid in STRATEGIES:
        build(conn, sid)
    conn.close()


if __name__ == '__main__':
    main()
