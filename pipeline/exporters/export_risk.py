"""Export portfolio-risk data (overlap, concentration, correlations) to static JSON.

Reads the CURRENT holdings the frontend already displays (the per-strategy
holdings JSON), joins sector from the DB, and computes real return
correlations from price_history. Emits frontend/public/data/risk/portfolio-risk.json.

Run after export_json.py:
    python3 -m pipeline.exporters.export_risk
"""

import glob
import json
import os
import sqlite3
from datetime import datetime, timezone

import numpy as np
import pandas as pd

BASE = os.path.join(os.path.dirname(__file__), '..', '..')
DB_PATH = os.path.join(BASE, 'database', 'asx_tracker.db')
DATA_DIR = os.path.join(BASE, 'frontend', 'public', 'data')
OUT_PATH = os.path.join(DATA_DIR, 'risk', 'portfolio-risk.json')

STRATEGY_NAMES = {
    'padley_momentum': 'Padley Momentum',
    'damodaran_dcf': 'Damodaran Intrinsic Value',
    'quant_factors': 'Quantitative Factors',
    'dividend_income': 'Dividend Income',
    'contrarian_value': 'Contrarian Deep Value',
}
STRATEGY_ORDER = list(STRATEGY_NAMES.keys())


def load_current_holdings() -> dict:
    """Return {strategy_id: [ticker, ...]} for open positions, from the exported JSON."""
    out: dict[str, list[str]] = {}
    for path in glob.glob(os.path.join(DATA_DIR, 'portfolios', '*-holdings.json')):
        sid = os.path.basename(path).replace('-holdings.json', '')
        if sid not in STRATEGY_NAMES:
            continue
        holdings = json.load(open(path))
        out[sid] = [h['ticker'] for h in holdings if h.get('sellPrice') is None]
    return out


def load_meta(conn: sqlite3.Connection, tickers: list[str]) -> dict:
    """Return {ticker: {name, sector}} from stocks table."""
    meta = {}
    for t in tickers:
        row = conn.execute('SELECT name, sector FROM stocks WHERE ticker=?', (t,)).fetchone()
        meta[t] = {
            'name': row[0] if row else t.replace('.AX', ''),
            'sector': (row[1] if row and row[1] else 'Unknown'),
        }
    return meta


def load_returns(conn: sqlite3.Connection, tickers: list[str]) -> pd.DataFrame:
    """Daily log-return DataFrame (rows=dates, cols=tickers), aligned on common dates."""
    frames = {}
    for t in tickers:
        rows = conn.execute(
            'SELECT date, adj_close FROM price_history WHERE ticker=? ORDER BY date', (t,)
        ).fetchall()
        if len(rows) < 30:
            continue
        s = pd.Series({d: c for d, c in rows}, dtype=float)
        frames[t] = np.log(s / s.shift(1))
    df = pd.DataFrame(frames).dropna(how='any')
    return df


def corr_records(matrix: np.ndarray) -> list[list[float]]:
    return [[round(float(v), 3) for v in row] for row in matrix]


def main() -> None:
    conn = sqlite3.connect(DB_PATH)

    membership = load_current_holdings()  # {sid: [tickers]}
    # Union of tickers, stable order (first appearance across strategy order)
    union: list[str] = []
    for sid in STRATEGY_ORDER:
        for t in membership.get(sid, []):
            if t not in union:
                union.append(t)

    meta = load_meta(conn, union)
    returns = load_returns(conn, union)
    priced = [t for t in union if t in returns.columns]  # tickers with usable price data

    # --- Stock-level correlation matrix (only priced tickers) ---
    R = returns[priced]
    stock_corr = np.corrcoef(R.values, rowvar=False) if len(priced) > 1 else np.array([[1.0]])
    ann_vol = {t: round(float(R[t].std() * np.sqrt(252) * 100), 1) for t in priced}

    # --- Strategy-level: each strategy = equal-weight portfolio of its priced holdings ---
    strat_series = {}
    for sid in STRATEGY_ORDER:
        cols = [t for t in membership.get(sid, []) if t in priced]
        if cols:
            strat_series[sid] = R[cols].mean(axis=1)
    strat_ids = [s for s in STRATEGY_ORDER if s in strat_series]
    strat_df = pd.DataFrame({s: strat_series[s] for s in strat_ids})
    strat_corr = np.corrcoef(strat_df.values, rowvar=False) if len(strat_ids) > 1 else np.array([[1.0]])

    # Average off-diagonal cross-strategy correlation (how independent are the 5 bets?)
    if len(strat_ids) > 1:
        off = strat_corr[np.triu_indices(len(strat_ids), k=1)]
        avg_strat_corr = round(float(off.mean()), 3)
    else:
        avg_strat_corr = None

    # --- Overlap + combined-portfolio concentration ---
    # Combined weight if you ran all 5 strategies with equal $ each, equal-weight within.
    n_strats = len([s for s in STRATEGY_ORDER if membership.get(s)])
    combined_w: dict[str, float] = {}
    for sid in STRATEGY_ORDER:
        held = membership.get(sid, [])
        if not held:
            continue
        w = (1.0 / n_strats) * (1.0 / len(held))
        for t in held:
            combined_w[t] = combined_w.get(t, 0.0) + w

    holdings = []
    for t in union:
        strats = [s for s in STRATEGY_ORDER if t in membership.get(s, [])]
        holdings.append({
            'ticker': t,
            'name': meta[t]['name'],
            'sector': meta[t]['sector'],
            'strategies': strats,
            'count': len(strats),
            'combinedWeight': round(combined_w.get(t, 0.0) * 100, 2),
            'priced': t in priced,
        })
    holdings.sort(key=lambda h: (-h['count'], -h['combinedWeight']))

    # Sector weights of the combined portfolio
    sector_w: dict[str, float] = {}
    for t, w in combined_w.items():
        sec = meta[t]['sector']
        sector_w[sec] = sector_w.get(sec, 0.0) + w * 100
    sector_weights = sorted(
        [{'sector': s, 'weight': round(w, 2)} for s, w in sector_w.items()],
        key=lambda x: -x['weight'],
    )

    payload = {
        'asOf': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'period': {
            'start': str(R.index.min()) if len(R) else None,
            'end': str(R.index.max()) if len(R) else None,
            'nObs': int(len(R)),
            'freq': 'daily',
        },
        'strategies': [{'id': s, 'name': STRATEGY_NAMES[s]} for s in STRATEGY_ORDER if membership.get(s)],
        'uniqueNames': len(union),
        'sharedNames': sum(1 for h in holdings if h['count'] > 1),
        'holdings': holdings,
        'stockCorr': {'tickers': [t.replace('.AX', '') for t in priced], 'matrix': corr_records(stock_corr)},
        'strategyCorr': {
            'ids': strat_ids,
            'names': [STRATEGY_NAMES[s] for s in strat_ids],
            'matrix': corr_records(strat_corr),
            'avgOffDiagonal': avg_strat_corr,
        },
        'annVol': ann_vol,
        'sectorWeights': sector_weights,
    }

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w') as f:
        json.dump(payload, f, indent=2)
    print(f"  Exported portfolio risk: {len(union)} names ({len(priced)} priced), "
          f"{payload['sharedNames']} shared, {payload['period']['nObs']} obs → {OUT_PATH}")


if __name__ == '__main__':
    main()
