"""Holdings-flow bump-chart data.

For each strategy, for each 6-month rebalance period, computes every held stock's
return over that period and its rank (1 = best). The frontend draws a bump chart:
one line per stock, Y = its return-rank that period, so a line that starts marks a
stock bought in, a line that ends marks one discarded, and dot colour shows whether
the stock made or lost money.

Reads the frozen period holdings from periods/{sid}.json and prices from the DB.
Emits frontend/public/data/periods/holdings-flow.json.
"""

import os
import json
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data')
OUT_PATH = os.path.join(DATA_DIR, 'periods', 'holdings-flow.json')

STRATEGIES = {
    'padley_momentum': 'Padley Momentum',
    'quant_factors': 'Quant Factors',
    'dividend_income': 'Dividend Income',
    'damodaran_dcf': 'Damodaran Value',
    'contrarian_value': 'Contrarian Value',
}


def price_on(conn, ticker, date, direction):
    op = '>=' if direction == 'fwd' else '<='
    order = 'ASC' if direction == 'fwd' else 'DESC'
    row = conn.execute(
        f"SELECT adj_close FROM price_history WHERE ticker=? AND date {op} ? AND adj_close IS NOT NULL "
        f"ORDER BY date {order} LIMIT 1", (ticker, date)).fetchone()
    return row[0] if row else None


def main():
    conn = sqlite3.connect(DB_PATH)
    latest = conn.execute("SELECT MAX(date) FROM price_history").fetchone()[0]
    names = {r[0].replace('.AX', ''): r[1] for r in conn.execute("SELECT ticker, name FROM stocks")}
    out = {'strategies': {}}

    all_periods = {}             # pid -> label (union across strategies)
    universe = {}                # ticker -> {name, cells: {pid: {ret, strategies:[sid]}}}

    for sid, name in STRATEGIES.items():
        path = os.path.join(DATA_DIR, 'periods', f'{sid}.json')
        if not os.path.exists(path):
            continue
        pj = json.load(open(path))
        periods_meta = []
        stock_cells = {}  # ticker -> {periodId: {rank, ret}}

        for p in pj['periods']:
            holds = p.get('holdings') or []
            if not holds:
                continue
            per = p['period']
            pid, buy, end = per['id'], per['buy'], min(per['end'], latest)
            periods_meta.append({'id': pid, 'label': per['label']})
            all_periods[pid] = per['label']

            rets = []
            for h in holds:
                t = h['ticker']
                bp = price_on(conn, t, buy, 'fwd')
                ep = price_on(conn, t, end, 'bwd')
                if bp and ep:
                    rets.append((t.replace('.AX', ''), (ep / bp - 1) * 100))
            rets.sort(key=lambda x: -x[1])
            for rank, (tk, r) in enumerate(rets, 1):
                rr = round(r, 1)
                stock_cells.setdefault(tk, {})[pid] = {'rank': rank, 'ret': rr}
                u = universe.setdefault(tk, {'name': names.get(tk, tk), 'cells': {}})
                cell = u['cells'].setdefault(pid, {'ret': rr, 'strategies': []})
                cell['strategies'].append(sid)

        stocks = [{'ticker': tk, 'name': names.get(tk, tk), 'cells': cells}
                  for tk, cells in stock_cells.items()]
        order = {pm['id']: i for i, pm in enumerate(periods_meta)}
        stocks.sort(key=lambda s: (min(order[p] for p in s['cells']),
                                   min(c['rank'] for c in s['cells'].values())))
        out['strategies'][sid] = {'name': name, 'periods': periods_meta, 'stocks': stocks}

    # period order for the union (by first strategy's ordering — all share the calendar)
    ref = next(iter(out['strategies'].values()))['periods'] if out['strategies'] else []
    out['allPeriods'] = [{'id': p['id'], 'label': p['label']} for p in ref]
    out['universe'] = {tk: u for tk, u in sorted(universe.items())}

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w') as f:
        json.dump(out, f, indent=2)
    tot = sum(len(v['stocks']) for v in out['strategies'].values())
    print(f"Exported holdings-flow: {len(out['strategies'])} strategies ({tot} tracks), "
          f"{len(universe)} unique stocks → {OUT_PATH}")


if __name__ == '__main__':
    main()
