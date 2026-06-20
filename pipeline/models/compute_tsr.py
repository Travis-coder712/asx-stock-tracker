"""Compute Total Shareholder Return for AGL vs ASX 200 benchmark."""

import sqlite3
import os
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')

PERIODS = [
    '2023-07-01',
    '2024-07-01',
    '2025-07-01',
    '2026-07-01',
]

TICKERS = ['AGL.AX', 'STW.AX']


def compute_tsr(conn: sqlite3.Connection, ticker: str, period_start: str) -> None:
    """Compute TSR from period_start to latest available date.

    TSR = (end_price + cumulative_dividends_reinvested - start_price) / start_price

    For dividend reinvestment: on each ex-date, calculate additional shares
    purchased at that day's closing price, then compound forward.
    """
    prices = conn.execute(
        "SELECT date, adj_close FROM price_history "
        "WHERE ticker=? AND date>=? ORDER BY date",
        (ticker, period_start)
    ).fetchall()

    if not prices:
        return

    dividends = conn.execute(
        "SELECT ex_date, amount FROM dividends "
        "WHERE ticker=? AND ex_date>=? ORDER BY ex_date",
        (ticker, period_start)
    ).fetchall()

    div_map = {d[0]: d[1] for d in dividends}

    start_price = prices[0][1]
    if not start_price or start_price <= 0:
        return

    shares = 1.0
    cumulative_div_value = 0.0

    conn.execute(
        "DELETE FROM tsr_tracking WHERE ticker=? AND period_start=?",
        (ticker, period_start)
    )

    for date_str, price in prices:
        if not price or price <= 0:
            continue

        if date_str in div_map:
            div_per_share = div_map[date_str]
            div_income = div_per_share * shares
            new_shares = div_income / price
            shares += new_shares
            cumulative_div_value += div_income

        total_value = shares * price
        tsr_pct = ((total_value - start_price) / start_price) * 100

        conn.execute(
            "INSERT OR REPLACE INTO tsr_tracking "
            "(ticker, date, price, cumulative_div, tsr_pct, period_start) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (ticker, date_str, price, cumulative_div_value,
             round(tsr_pct, 2), period_start)
        )

    conn.commit()


def main():
    conn = sqlite3.connect(DB_PATH)

    for ticker in TICKERS:
        for period in PERIODS:
            first_price = conn.execute(
                "SELECT date FROM price_history WHERE ticker=? AND date>=? LIMIT 1",
                (ticker, period)
            ).fetchone()
            if not first_price:
                print(f"  {ticker} period {period}: no data yet, skipping")
                continue

            compute_tsr(conn, ticker, period)

            latest = conn.execute(
                "SELECT date, tsr_pct FROM tsr_tracking "
                "WHERE ticker=? AND period_start=? ORDER BY date DESC LIMIT 1",
                (ticker, period)
            ).fetchone()

            if latest:
                print(f"  {ticker} from {period} → {latest[1]:+.1f}% TSR as of {latest[0]}")
            else:
                print(f"  {ticker} from {period}: computed but no results")

    conn.close()
    print("\nDone.")


if __name__ == '__main__':
    main()
