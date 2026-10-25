"""Compute Total Shareholder Return for AGL vs ASX 100 benchmark."""

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

TICKERS = ['AGL.AX', '^ATOI', 'STW.AX']


def compute_tsr(conn: sqlite3.Connection, ticker: str, period_start: str) -> None:
    """Compute Total Shareholder Return from period_start to latest date.

    TSR = adj_close(date) / adj_close(start) - 1

    `adj_close` from yfinance is ALREADY total-return adjusted — it bakes in
    dividends reinvested at the ex-date close. So the adj_close ratio *is* the
    TSR with dividends reinvested, and NO manual dividend reinvestment is needed.

    (The previous version reinvested the raw cash dividends on top of adj_close,
    double-counting them — e.g. AGL from 2023-07-01 read +22.8% when the true
    total return is ~+0.2%, because its ~17% of dividends were counted twice.
    That also biased the peer ranking toward high-yield stocks. Fixed 2026-10-25.)

    `cumulative_div` is kept purely for display — the running sum of cash
    dividends per share — and is NOT part of the TSR maths.
    """
    prices = conn.execute(
        "SELECT date, adj_close FROM price_history "
        "WHERE ticker=? AND date>=? AND adj_close IS NOT NULL ORDER BY date",
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

    cumulative_div = 0.0

    conn.execute(
        "DELETE FROM tsr_tracking WHERE ticker=? AND period_start=?",
        (ticker, period_start)
    )

    for date_str, price in prices:
        if not price or price <= 0:
            continue

        if date_str in div_map:
            cumulative_div += div_map[date_str]

        tsr_pct = ((price / start_price) - 1) * 100  # adj_close = total return

        conn.execute(
            "INSERT OR REPLACE INTO tsr_tracking "
            "(ticker, date, price, cumulative_div, tsr_pct, period_start) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (ticker, date_str, price, round(cumulative_div, 4),
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
