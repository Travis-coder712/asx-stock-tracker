"""Create the ASX Stock Tracker SQLite database schema."""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'asx_tracker.db')


def create_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
    -- ASX stock master data
    CREATE TABLE IF NOT EXISTS stocks (
        ticker          TEXT PRIMARY KEY,       -- e.g. 'AGL.AX'
        name            TEXT NOT NULL,
        sector          TEXT,
        market_cap      REAL,
        last_updated    TEXT
    );

    -- Daily price + dividend history
    CREATE TABLE IF NOT EXISTS price_history (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker          TEXT NOT NULL REFERENCES stocks(ticker),
        date            TEXT NOT NULL,           -- YYYY-MM-DD
        open            REAL,
        high            REAL,
        low             REAL,
        close           REAL,
        adj_close       REAL,
        volume          INTEGER,
        UNIQUE(ticker, date)
    );

    -- Dividend history
    CREATE TABLE IF NOT EXISTS dividends (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker          TEXT NOT NULL REFERENCES stocks(ticker),
        ex_date         TEXT NOT NULL,           -- YYYY-MM-DD
        amount          REAL NOT NULL,
        franking_pct    REAL,                    -- 0-100
        UNIQUE(ticker, ex_date)
    );

    -- Fundamental data snapshots
    CREATE TABLE IF NOT EXISTS fundamentals (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker          TEXT NOT NULL REFERENCES stocks(ticker),
        date            TEXT NOT NULL,           -- snapshot date
        pe_ratio        REAL,
        pb_ratio        REAL,
        roe             REAL,
        debt_equity     REAL,
        dividend_yield  REAL,
        payout_ratio    REAL,
        eps             REAL,
        book_value      REAL,
        market_cap      REAL,
        free_cash_flow  REAL,
        current_ratio   REAL,
        revenue         REAL,
        net_income      REAL,
        UNIQUE(ticker, date)
    );

    -- Strategy definitions
    CREATE TABLE IF NOT EXISTS strategies (
        id              TEXT PRIMARY KEY,        -- e.g. 'padley_momentum'
        name            TEXT NOT NULL,
        description     TEXT,
        methodology     TEXT,                    -- detailed approach
        rebalance_freq  TEXT DEFAULT 'quarterly' -- monthly/quarterly/annually
    );

    -- Portfolio: which stocks each strategy holds
    CREATE TABLE IF NOT EXISTS portfolio_holdings (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id     TEXT NOT NULL REFERENCES strategies(id),
        ticker          TEXT NOT NULL REFERENCES stocks(ticker),
        shares          REAL NOT NULL,
        buy_price       REAL NOT NULL,
        buy_date        TEXT NOT NULL,
        sell_price      REAL,
        sell_date       TEXT,
        is_manual       INTEGER DEFAULT 0,       -- 1 = manual override
        rationale       TEXT,
        UNIQUE(strategy_id, ticker, buy_date)
    );

    -- Portfolio snapshots (daily value tracking)
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy_id     TEXT NOT NULL REFERENCES strategies(id),
        date            TEXT NOT NULL,
        total_value     REAL NOT NULL,
        cash            REAL NOT NULL DEFAULT 0,
        num_holdings    INTEGER,
        daily_return    REAL,
        UNIQUE(strategy_id, date)
    );

    -- AGL TSR tracking
    CREATE TABLE IF NOT EXISTS tsr_tracking (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        ticker          TEXT NOT NULL,           -- 'AGL.AX' or 'XTO.AX' (ASX 100 index)
        date            TEXT NOT NULL,
        price           REAL NOT NULL,
        cumulative_div  REAL DEFAULT 0,          -- reinvested dividends
        tsr_pct         REAL,                    -- total shareholder return %
        period_start    TEXT NOT NULL,            -- e.g. '2023-07-01'
        UNIQUE(ticker, date, period_start)
    );

    -- Import run log
    CREATE TABLE IF NOT EXISTS import_runs (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        source          TEXT NOT NULL,
        started_at      TEXT NOT NULL,
        finished_at     TEXT,
        records_added   INTEGER DEFAULT 0,
        status          TEXT DEFAULT 'running'
    );
    """)
    conn.commit()


def seed_strategies(conn: sqlite3.Connection) -> None:
    strategies = [
        ('padley_momentum', 'Padley Momentum',
         'Trend-following with capital preservation, inspired by Marcus Padley / Marcus Today.',
         'Screen by earnings momentum + ROE, rank by 12-month price momentum. '
         'Risk-off signal: go to cash when ASX 200 breaks below 200-day MA.'),
        ('damodaran_dcf', 'Damodaran Intrinsic Value',
         'DCF valuation with narrative-to-numbers approach, inspired by Aswath Damodaran.',
         'Simplified DCF for ASX stocks. Score by discount-to-intrinsic-value. '
         'Supplemented by relative valuation (P/E, EV/EBITDA vs peers).'),
        ('quant_factors', 'Quantitative Factors',
         'Multi-factor model ranking stocks by value, momentum, quality, and low volatility.',
         'Rank by: value (low P/B), momentum (12-1 month returns), '
         'quality (high ROE, low debt), low volatility. Equal-weight top-ranked.'),
        ('dividend_income', 'Dividend Income',
         'High-yield dividend strategy with franking credit advantage.',
         'Rank by grossed-up yield (including franking), filter by payout ratio <80%, '
         'DPS growth >0 over 3yr, FCF coverage >1.2x.'),
        ('contrarian_value', 'Contrarian Deep Value',
         'Graham/Buffett-style value investing seeking stocks below intrinsic value.',
         'Graham Number screen: sqrt(22.5 x EPS x BVPS) > current price. '
         'Filter P/B <1, current ratio >1.5, 5yr positive earnings.'),
    ]
    conn.executemany(
        "INSERT OR IGNORE INTO strategies (id, name, description, methodology) VALUES (?, ?, ?, ?)",
        strategies
    )
    conn.commit()


def main():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    create_tables(conn)
    seed_strategies(conn)
    print(f"Database created at {DB_PATH}")
    for row in conn.execute("SELECT id, name FROM strategies"):
        print(f"  Strategy: {row[0]} — {row[1]}")
    conn.close()


if __name__ == '__main__':
    main()
