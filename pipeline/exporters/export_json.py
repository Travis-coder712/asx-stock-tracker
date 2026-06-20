"""Export SQLite data to static JSON for the frontend."""

import json
import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data')


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def export_strategies(conn: sqlite3.Connection) -> None:
    rows = conn.execute("SELECT id, name, description, methodology, rebalance_freq FROM strategies").fetchall()
    data = [
        {'id': r[0], 'name': r[1], 'description': r[2], 'methodology': r[3], 'rebalanceFreq': r[4]}
        for r in rows
    ]
    path = os.path.join(OUTPUT_DIR, 'strategies.json')
    ensure_dir(os.path.dirname(path))
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  Exported {len(data)} strategies")


def export_portfolio_snapshots(conn: sqlite3.Connection) -> None:
    strategies = conn.execute("SELECT id FROM strategies").fetchall()
    ensure_dir(os.path.join(OUTPUT_DIR, 'portfolios'))
    for (sid,) in strategies:
        rows = conn.execute(
            "SELECT date, total_value, cash, num_holdings, daily_return "
            "FROM portfolio_snapshots WHERE strategy_id=? ORDER BY date",
            (sid,)
        ).fetchall()
        data = [
            {'date': r[0], 'totalValue': r[1], 'cash': r[2],
             'numHoldings': r[3], 'dailyReturn': r[4]}
            for r in rows
        ]
        path = os.path.join(OUTPUT_DIR, 'portfolios', f'{sid}.json')
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"  Exported {len(data)} snapshots for {sid}")


def export_holdings(conn: sqlite3.Connection) -> None:
    strategies = conn.execute("SELECT id FROM strategies").fetchall()
    ensure_dir(os.path.join(OUTPUT_DIR, 'portfolios'))
    for (sid,) in strategies:
        rows = conn.execute(
            "SELECT h.ticker, s.name, h.shares, h.buy_price, h.buy_date, "
            "h.sell_price, h.sell_date, h.is_manual, h.rationale "
            "FROM portfolio_holdings h JOIN stocks s ON h.ticker = s.ticker "
            "WHERE h.strategy_id=? ORDER BY h.buy_date",
            (sid,)
        ).fetchall()
        data = [
            {'ticker': r[0], 'name': r[1], 'shares': r[2], 'buyPrice': r[3],
             'buyDate': r[4], 'sellPrice': r[5], 'sellDate': r[6],
             'isManual': bool(r[7]), 'rationale': r[8]}
            for r in rows
        ]
        path = os.path.join(OUTPUT_DIR, 'portfolios', f'{sid}-holdings.json')
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"  Exported {len(data)} holdings for {sid}")


def export_agl_tsr(conn: sqlite3.Connection) -> None:
    ensure_dir(os.path.join(OUTPUT_DIR, 'tsr'))
    periods = ['2023-07-01', '2024-07-01', '2025-07-01', '2026-07-01']
    for period in periods:
        rows = conn.execute(
            "SELECT ticker, date, price, cumulative_div, tsr_pct "
            "FROM tsr_tracking WHERE period_start=? ORDER BY ticker, date",
            (period,)
        ).fetchall()
        if not rows:
            continue
        data = {}
        for r in rows:
            ticker = r[0]
            if ticker not in data:
                data[ticker] = []
            data[ticker].append({
                'date': r[1], 'price': r[2],
                'cumulativeDiv': r[3], 'tsrPct': r[4]
            })
        path = os.path.join(OUTPUT_DIR, 'tsr', f'tsr-{period}.json')
        with open(path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"  Exported TSR data for period starting {period}")


def export_tsr_summary(conn: sqlite3.Connection) -> None:
    """Export latest TSR % for each ticker/period — used by dashboard cards."""
    periods = ['2023-07-01', '2024-07-01', '2025-07-01', '2026-07-01']
    summary = []
    for period in periods:
        row_agl = conn.execute(
            "SELECT date, tsr_pct FROM tsr_tracking "
            "WHERE ticker='AGL.AX' AND period_start=? ORDER BY date DESC LIMIT 1",
            (period,)
        ).fetchone()
        row_idx = conn.execute(
            "SELECT date, tsr_pct FROM tsr_tracking "
            "WHERE ticker='^ATOI' AND period_start=? ORDER BY date DESC LIMIT 1",
            (period,)
        ).fetchone()
        summary.append({
            'periodStart': period,
            'asOf': row_agl[0] if row_agl else None,
            'aglTsr': row_agl[1] if row_agl else None,
            'indexTsr': row_idx[1] if row_idx else None,
        })
    path = os.path.join(OUTPUT_DIR, 'tsr', 'tsr-summary.json')
    ensure_dir(os.path.dirname(path))
    with open(path, 'w') as f:
        json.dump(summary, f, indent=2)
    print(f"  Exported TSR summary ({len([s for s in summary if s['aglTsr'] is not None])} periods with data)")


def export_agl_price_chart(conn: sqlite3.Connection) -> None:
    """Export AGL + STW daily prices for the chart."""
    ensure_dir(os.path.join(OUTPUT_DIR, 'charts'))
    rows = conn.execute(
        "SELECT p1.date, p1.adj_close as agl, p2.adj_close as asx100 "
        "FROM price_history p1 "
        "LEFT JOIN price_history p2 ON p1.date = p2.date AND p2.ticker = '^ATOI' "
        "WHERE p1.ticker = 'AGL.AX' AND p1.date >= '2023-07-01' "
        "ORDER BY p1.date"
    ).fetchall()
    data = [{'date': r[0], 'agl': round(r[1], 2) if r[1] else None,
             'asx100': round(r[2], 2) if r[2] else None} for r in rows]
    path = os.path.join(OUTPUT_DIR, 'charts', 'agl-vs-index.json')
    with open(path, 'w') as f:
        json.dump(data, f)
    print(f"  Exported {len(data)} days of AGL vs STW price data")


def export_stock_list(conn: sqlite3.Connection) -> None:
    rows = conn.execute(
        "SELECT s.ticker, s.name, s.sector, s.market_cap, "
        "f.pe_ratio, f.pb_ratio, f.dividend_yield, f.roe "
        "FROM stocks s LEFT JOIN fundamentals f ON s.ticker = f.ticker "
        "WHERE s.ticker LIKE '%.AX' ORDER BY s.market_cap DESC NULLS LAST"
    ).fetchall()
    data = [
        {'ticker': r[0], 'name': r[1], 'sector': r[2], 'marketCap': r[3],
         'pe': r[4], 'pb': r[5], 'divYield': r[6], 'roe': r[7]}
        for r in rows
    ]
    path = os.path.join(OUTPUT_DIR, 'stocks.json')
    ensure_dir(os.path.dirname(path))
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"  Exported {len(data)} stocks")


def export_metadata(conn: sqlite3.Connection) -> None:
    latest_price = conn.execute(
        "SELECT MAX(date) FROM price_history"
    ).fetchone()[0]
    latest_import = conn.execute(
        "SELECT MAX(finished_at) FROM import_runs WHERE status='complete'"
    ).fetchone()[0]
    stock_count = conn.execute(
        "SELECT COUNT(*) FROM stocks WHERE ticker LIKE '%.AX'"
    ).fetchone()[0]
    meta = {
        'version': '0.1.0',
        'builtAt': datetime.now().isoformat(),
        'latestPrice': latest_price,
        'latestImport': latest_import,
        'stockCount': stock_count,
    }
    path = os.path.join(OUTPUT_DIR, 'metadata.json')
    ensure_dir(os.path.dirname(path))
    with open(path, 'w') as f:
        json.dump(meta, f, indent=2)
    print(f"  Exported metadata")


def main():
    conn = sqlite3.connect(DB_PATH)
    print("Exporting to JSON...")
    export_strategies(conn)
    export_stock_list(conn)
    export_portfolio_snapshots(conn)
    export_holdings(conn)
    export_agl_tsr(conn)
    export_tsr_summary(conn)
    export_agl_price_chart(conn)
    export_metadata(conn)
    conn.close()
    print("Done.")


if __name__ == '__main__':
    main()
