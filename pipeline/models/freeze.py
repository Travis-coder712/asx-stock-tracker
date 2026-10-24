"""Frozen-picks ledger — the root-cause fix for look-ahead instability.

The strategy screens use *current* fundamentals (yfinance gives us no reliable
point-in-time history), so re-running them rewrites historical picks and makes
the "since 2024" numbers drift on every refresh. The fix: screen each pick-set
exactly ONCE, freeze it here, and from then on only re-price it forward.

- `frozen_picks`  — the immutable pick ledger (seeded from the originally
  committed picks so continuity with what users saw is preserved).
- `fundamentals_history` — a dated archive of fundamentals, appended on every
  import, so FUTURE first-time screens can use as-of-date fundamentals rather
  than whatever happens to be current at refresh time.

scope = 'main' (the buy-and-hold-since-2024 portfolio) or a period id ('H1-2024').
"""

import os
import json
import sqlite3

SEED_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'frozen_picks_seed.json')


def ensure_tables(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS frozen_picks (
            strategy_id TEXT NOT NULL,
            scope       TEXT NOT NULL,   -- 'main' or a period id e.g. 'H1-2024'
            ticker      TEXT NOT NULL,
            rank        INTEGER,
            name        TEXT,
            rationale   TEXT,
            buy_date    TEXT,            -- set for 'main'; periods re-derive at buy date
            buy_price   REAL,            -- set for 'main'
            shares      REAL,            -- set for 'main'
            frozen_at   TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (strategy_id, scope, ticker)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS fundamentals_history (
            ticker        TEXT NOT NULL,
            snapshot_date TEXT NOT NULL,
            pe_ratio REAL, pb_ratio REAL, roe REAL, debt_equity REAL,
            dividend_yield REAL, payout_ratio REAL, eps REAL, book_value REAL,
            market_cap REAL, free_cash_flow REAL, current_ratio REAL,
            PRIMARY KEY (ticker, snapshot_date)
        )
    """)
    conn.commit()


def seed_if_empty(conn: sqlite3.Connection) -> int:
    """Load the committed seed into frozen_picks the first time only."""
    ensure_tables(conn)
    existing = conn.execute("SELECT COUNT(*) FROM frozen_picks").fetchone()[0]
    if existing:
        return 0
    with open(SEED_PATH) as f:
        seed = json.load(f)
    n = 0
    for sid, entry in seed.items():
        for rank, h in enumerate(entry.get('main', []), 1):
            conn.execute(
                "INSERT OR IGNORE INTO frozen_picks "
                "(strategy_id, scope, ticker, rank, name, rationale, buy_date, buy_price, shares) "
                "VALUES (?,?,?,?,?,?,?,?,?)",
                (sid, 'main', h['ticker'], rank, h.get('name'), h.get('rationale'),
                 h.get('buyDate'), h.get('buyPrice'), h.get('shares')))
            n += 1
        for pid, picks in entry.get('periods', {}).items():
            for rank, h in enumerate(picks, 1):
                conn.execute(
                    "INSERT OR IGNORE INTO frozen_picks "
                    "(strategy_id, scope, ticker, rank, name, rationale) VALUES (?,?,?,?,?,?)",
                    (sid, pid, h['ticker'], rank, h.get('name'), h.get('rationale')))
                n += 1
    conn.commit()
    return n


def get_frozen(conn: sqlite3.Connection, strategy_id: str, scope: str):
    """Return frozen picks for (strategy, scope) ordered by rank, or None."""
    rows = conn.execute(
        "SELECT ticker, name, rationale, buy_date, buy_price, shares "
        "FROM frozen_picks WHERE strategy_id=? AND scope=? ORDER BY rank",
        (strategy_id, scope)).fetchall()
    if not rows:
        return None
    return [{'ticker': r[0], 'name': r[1], 'rationale': r[2],
             'buyDate': r[3], 'buyPrice': r[4], 'shares': r[5]} for r in rows]


def freeze(conn: sqlite3.Connection, strategy_id: str, scope: str, picks) -> None:
    """Persist a freshly-screened pick-set so it never re-screens again."""
    ensure_tables(conn)
    for rank, p in enumerate(picks, 1):
        conn.execute(
            "INSERT OR IGNORE INTO frozen_picks "
            "(strategy_id, scope, ticker, rank, name, rationale, buy_date, buy_price, shares) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            (strategy_id, scope, p['ticker'], rank, p.get('name'), p.get('rationale'),
             p.get('buyDate'), p.get('buyPrice'), p.get('shares')))
    conn.commit()


def snapshot_fundamentals(conn: sqlite3.Connection, as_of: str) -> int:
    """Append today's fundamentals into the dated archive (idempotent per date)."""
    ensure_tables(conn)
    rows = conn.execute(
        "SELECT ticker, pe_ratio, pb_ratio, roe, debt_equity, dividend_yield, "
        "payout_ratio, eps, book_value, market_cap, free_cash_flow, current_ratio "
        "FROM fundamentals").fetchall()
    n = 0
    for r in rows:
        conn.execute(
            "INSERT OR IGNORE INTO fundamentals_history "
            "(ticker, snapshot_date, pe_ratio, pb_ratio, roe, debt_equity, dividend_yield, "
            "payout_ratio, eps, book_value, market_cap, free_cash_flow, current_ratio) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (r[0], as_of, *r[1:]))
        n += 1
    conn.commit()
    return n
