"""Fetch ASX stock price + dividend history via yfinance."""

import sqlite3
import os
import sys
from datetime import datetime, timedelta
from typing import Optional

try:
    import yfinance as yf
except ImportError:
    print("Install yfinance: pip install yfinance")
    sys.exit(1)

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')

ASX_100_TICKERS = [
    'AGL.AX', 'ALL.AX', 'ALX.AX', 'AMC.AX', 'AMP.AX', 'ANZ.AX', 'APA.AX',
    'APX.AX', 'ARB.AX', 'ASX.AX', 'BHP.AX', 'BKW.AX', 'BLD.AX', 'BOQ.AX',
    'BPT.AX', 'BXB.AX', 'CAR.AX', 'CBA.AX', 'CCL.AX', 'CHC.AX', 'COH.AX',
    'COL.AX', 'CPU.AX', 'CSL.AX', 'CSR.AX', 'CTX.AX', 'CWY.AX', 'DXS.AX',
    'ELD.AX', 'EVN.AX', 'FLT.AX', 'FMG.AX', 'FPH.AX', 'GMG.AX', 'GOZ.AX',
    'GPT.AX', 'HVN.AX', 'IAG.AX', 'IEL.AX', 'IGO.AX', 'ILU.AX', 'IPL.AX',
    'JBH.AX', 'JHX.AX', 'LLC.AX', 'LNK.AX', 'MEZ.AX', 'MGR.AX', 'MIN.AX',
    'MQG.AX', 'MPL.AX', 'NAB.AX', 'NCM.AX', 'NEC.AX', 'NHF.AX', 'NST.AX',
    'NXT.AX', 'ORA.AX', 'ORG.AX', 'ORI.AX', 'OSH.AX', 'PLS.AX', 'PME.AX',
    'QAN.AX', 'QBE.AX', 'REA.AX', 'RHC.AX', 'RIO.AX', 'RMD.AX', 'S32.AX',
    'SCP.AX', 'SEK.AX', 'SGP.AX', 'SHL.AX', 'SKC.AX', 'SOL.AX', 'STO.AX',
    'SUN.AX', 'SVW.AX', 'TAH.AX', 'TCL.AX', 'TLC.AX', 'TLS.AX', 'TNE.AX',
    'TPG.AX', 'TWE.AX', 'VCX.AX', 'WBC.AX', 'WDS.AX', 'WES.AX', 'WHC.AX',
    'WOR.AX', 'WOW.AX', 'WTC.AX', 'XRO.AX',
]

AGL_TICKER = 'AGL.AX'
ASX200_INDEX = '^AXJO'
ASX200_ETF = 'STW.AX'


def log_run(conn: sqlite3.Connection, source: str) -> int:
    cur = conn.execute(
        "INSERT INTO import_runs (source, started_at) VALUES (?, ?)",
        (source, datetime.now().isoformat())
    )
    conn.commit()
    return cur.lastrowid


def finish_run(conn: sqlite3.Connection, run_id: int, count: int, status: str = 'complete'):
    conn.execute(
        "UPDATE import_runs SET finished_at=?, records_added=?, status=? WHERE id=?",
        (datetime.now().isoformat(), count, status, run_id)
    )
    conn.commit()


def import_stock_info(conn: sqlite3.Connection, ticker: str) -> None:
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        conn.execute(
            "INSERT OR REPLACE INTO stocks (ticker, name, sector, market_cap, last_updated) "
            "VALUES (?, ?, ?, ?, ?)",
            (ticker, info.get('longName', ticker.replace('.AX', '')),
             info.get('sector'), info.get('marketCap'),
             datetime.now().isoformat())
        )
    except Exception as e:
        print(f"  Warning: could not fetch info for {ticker}: {e}")
        conn.execute(
            "INSERT OR IGNORE INTO stocks (ticker, name, last_updated) VALUES (?, ?, ?)",
            (ticker, ticker.replace('.AX', ''), datetime.now().isoformat())
        )


def import_prices(conn: sqlite3.Connection, ticker: str,
                   start: str = '2023-01-01', end: Optional[str] = None) -> int:
    if end is None:
        end = datetime.now().strftime('%Y-%m-%d')
    try:
        stock = yf.Ticker(ticker)
        hist = stock.history(start=start, end=end, auto_adjust=False)
        if hist.empty:
            print(f"  No price data for {ticker}")
            return 0
        count = 0
        for date_idx, row in hist.iterrows():
            date_str = date_idx.strftime('%Y-%m-%d')
            try:
                conn.execute(
                    "INSERT OR IGNORE INTO price_history "
                    "(ticker, date, open, high, low, close, adj_close, volume) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (ticker, date_str, float(row['Open']), float(row['High']),
                     float(row['Low']), float(row['Close']),
                     float(row.get('Adj Close', row['Close'])),
                     int(row['Volume']))
                )
                count += 1
            except Exception:
                pass
        return count
    except Exception as e:
        print(f"  Error fetching prices for {ticker}: {e}")
        return 0


def import_dividends(conn: sqlite3.Connection, ticker: str,
                      start: str = '2023-01-01') -> int:
    try:
        stock = yf.Ticker(ticker)
        divs = stock.dividends
        if divs.empty:
            return 0
        count = 0
        for date_idx, amount in divs.items():
            date_str = date_idx.strftime('%Y-%m-%d')
            if date_str < start:
                continue
            try:
                conn.execute(
                    "INSERT OR IGNORE INTO dividends (ticker, ex_date, amount) "
                    "VALUES (?, ?, ?)",
                    (ticker, date_str, float(amount))
                )
                count += 1
            except Exception:
                pass
        return count
    except Exception as e:
        print(f"  Error fetching dividends for {ticker}: {e}")
        return 0


def import_fundamentals(conn: sqlite3.Connection, ticker: str) -> int:
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        today = datetime.now().strftime('%Y-%m-%d')
        conn.execute(
            "INSERT OR REPLACE INTO fundamentals "
            "(ticker, date, pe_ratio, pb_ratio, roe, debt_equity, dividend_yield, "
            "payout_ratio, eps, book_value, market_cap, free_cash_flow, current_ratio, "
            "revenue, net_income) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (ticker, today,
             info.get('trailingPE'), info.get('priceToBook'),
             info.get('returnOnEquity'), info.get('debtToEquity'),
             info.get('dividendYield'), info.get('payoutRatio'),
             info.get('trailingEps'), info.get('bookValue'),
             info.get('marketCap'), info.get('freeCashflow'),
             info.get('currentRatio'), info.get('totalRevenue'),
             info.get('netIncomeToCommon'))
        )
        return 1
    except Exception as e:
        print(f"  Error fetching fundamentals for {ticker}: {e}")
        return 0


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Import ASX stock data')
    parser.add_argument('--ticker', type=str, help='Single ticker (e.g. AGL.AX)')
    parser.add_argument('--agl-only', action='store_true', help='Only fetch AGL data')
    parser.add_argument('--top-20', action='store_true', help='Fetch top 20 ASX stocks')
    parser.add_argument('--all', action='store_true', help='Fetch all ASX 100 stocks')
    parser.add_argument('--start', type=str, default='2023-01-01', help='Start date')
    args = parser.parse_args()

    conn = sqlite3.connect(DB_PATH)

    if args.ticker:
        tickers = [args.ticker]
    elif args.agl_only:
        tickers = [AGL_TICKER]
    elif args.top_20:
        tickers = ASX_100_TICKERS[:20]
    elif args.all:
        tickers = ASX_100_TICKERS
    else:
        tickers = [AGL_TICKER]
        print("No flag specified, defaulting to AGL only. Use --all for ASX 100.")

    run_id = log_run(conn, f"yfinance:{','.join(tickers[:5])}...")
    total = 0

    for i, ticker in enumerate(tickers):
        print(f"[{i+1}/{len(tickers)}] {ticker}")
        import_stock_info(conn, ticker)
        p = import_prices(conn, ticker, start=args.start)
        d = import_dividends(conn, ticker, start=args.start)
        f = import_fundamentals(conn, ticker)
        print(f"  → {p} prices, {d} dividends, {f} fundamentals")
        total += p + d + f
        conn.commit()

    # Fetch ASX 200 index + STW ETF (total return proxy) for TSR comparison
    for idx_ticker, idx_name in [
        (ASX200_INDEX, 'S&P/ASX 200 Index'),
        (ASX200_ETF, 'SPDR S&P/ASX 200 ETF (total return proxy)'),
    ]:
        print(f"\nFetching {idx_name} ({idx_ticker})...")
        conn.execute(
            "INSERT OR IGNORE INTO stocks (ticker, name, last_updated) VALUES (?, ?, ?)",
            (idx_ticker, idx_name, datetime.now().isoformat())
        )
        idx_count = import_prices(conn, idx_ticker, start=args.start)
        d_count = import_dividends(conn, idx_ticker, start=args.start)
        print(f"  → {idx_count} prices, {d_count} dividends")
        total += idx_count + d_count

    finish_run(conn, run_id, total)
    print(f"\nDone. {total} total records imported.")
    conn.close()


if __name__ == '__main__':
    main()
