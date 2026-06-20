"""Screen stocks using all 5 strategies against current data.

Outputs what each strategy would pick TODAY, with full rationale
and metrics. Also computes sector diversification and flags
historically high/low fundamentals.
"""

import sqlite3
import os
import json
import math
from datetime import datetime, timedelta
from collections import defaultdict

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'asx_tracker.db')
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data')

SECTOR_GROUPS = {
    'Financials': 'Financials',
    'Financial Services': 'Financials',
    'Real Estate': 'Real Estate',
    'Materials': 'Materials',
    'Basic Materials': 'Materials',
    'Energy': 'Energy',
    'Utilities': 'Utilities',
    'Healthcare': 'Healthcare',
    'Technology': 'Technology',
    'Communication Services': 'Communication',
    'Consumer Cyclical': 'Consumer',
    'Consumer Defensive': 'Consumer',
    'Industrials': 'Industrials',
}


def get_latest_date(conn):
    row = conn.execute("SELECT MAX(date) FROM price_history WHERE ticker LIKE '%.AX'").fetchone()
    return row[0] if row else datetime.now().strftime('%Y-%m-%d')


def get_price(conn, ticker, date=None):
    if date:
        row = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? AND date<=? ORDER BY date DESC LIMIT 1",
            (ticker, date)
        ).fetchone()
    else:
        row = conn.execute(
            "SELECT adj_close FROM price_history WHERE ticker=? ORDER BY date DESC LIMIT 1",
            (ticker,)
        ).fetchone()
    return row[0] if row and row[0] else None


def get_momentum(conn, ticker, months=12):
    latest = get_latest_date(conn)
    start = (datetime.strptime(latest, '%Y-%m-%d') - timedelta(days=months*30)).strftime('%Y-%m-%d')
    p_start = get_price(conn, ticker, start)
    p_end = get_price(conn, ticker, latest)
    if p_start and p_end and p_start > 0:
        return round(((p_end - p_start) / p_start) * 100, 1)
    return None


def get_fundamentals(conn, ticker):
    row = conn.execute("""
        SELECT pe_ratio, pb_ratio, roe, dividend_yield, payout_ratio,
               eps, book_value, market_cap, free_cash_flow, current_ratio,
               debt_equity, revenue, net_income
        FROM fundamentals WHERE ticker=? ORDER BY date DESC LIMIT 1
    """, (ticker,)).fetchone()
    if not row:
        return None
    return {
        'pe': row[0], 'pb': row[1], 'roe': row[2], 'divYield': row[3],
        'payoutRatio': row[4], 'eps': row[5], 'bvps': row[6],
        'marketCap': row[7], 'fcf': row[8], 'currentRatio': row[9],
        'debtEquity': row[10], 'revenue': row[11], 'netIncome': row[12],
    }


def get_sector(conn, ticker):
    row = conn.execute("SELECT sector FROM stocks WHERE ticker=?", (ticker,)).fetchone()
    raw = row[0] if row else None
    return SECTOR_GROUPS.get(raw, raw or 'Unknown')


def get_name(conn, ticker):
    row = conn.execute("SELECT name FROM stocks WHERE ticker=?", (ticker,)).fetchone()
    return row[0] if row else ticker.replace('.AX', '')


def historical_percentile(conn, ticker, metric, current_val):
    """Where does the current value sit vs historical range?"""
    if current_val is None:
        return None
    # Use price history as a rough proxy for historical range
    # For P/E, we can only compare current vs what yfinance gives us (point-in-time)
    # So we'll flag relative to sector median instead
    return None  # Placeholder — enhanced in sector comparison below


def screen_padley(conn):
    latest = get_latest_date(conn)
    # Check risk-off
    idx_prices = conn.execute(
        "SELECT adj_close FROM price_history WHERE ticker='^ATOI' AND date<=? ORDER BY date DESC LIMIT 200",
        (latest,)
    ).fetchall()
    if len(idx_prices) >= 200:
        ma200 = sum(p[0] for p in idx_prices if p[0]) / len([p for p in idx_prices if p[0]])
        current = idx_prices[0][0]
        risk_off = current < ma200
    else:
        risk_off = False

    if risk_off:
        return {'riskOff': True, 'picks': [], 'signal': 'CASH — ASX 100 below 200-day MA'}

    tickers = [r[0] for r in conn.execute(
        "SELECT DISTINCT ticker FROM fundamentals WHERE ticker LIKE '%.AX'"
    ).fetchall()]

    picks = []
    for t in tickers:
        f = get_fundamentals(conn, t)
        if not f or not f['eps'] or f['eps'] <= 0:
            continue
        if not f['roe'] or f['roe'] <= 0.10:
            continue
        if not f['marketCap'] or f['marketCap'] < 1e9:
            continue
        mom = get_momentum(conn, t)
        if not mom or mom <= 0:
            continue
        picks.append({
            'ticker': t, 'name': get_name(conn, t), 'sector': get_sector(conn, t),
            'momentum': mom, 'roe': round(f['roe'] * 100, 1) if f['roe'] else None,
            'eps': round(f['eps'], 2), 'pe': round(f['pe'], 1) if f['pe'] else None,
            'price': get_price(conn, t),
            'rationale': f"Mom {mom:+.0f}%, ROE {f['roe']*100:.0f}%, EPS ${f['eps']:.2f}",
        })

    picks.sort(key=lambda x: x['momentum'], reverse=True)
    return {'riskOff': False, 'picks': picks[:10], 'signal': 'RISK ON — ASX 100 above 200-day MA'}


def screen_dividend(conn):
    tickers = [r[0] for r in conn.execute(
        "SELECT DISTINCT ticker FROM fundamentals WHERE ticker LIKE '%.AX'"
    ).fetchall()]
    picks = []
    for t in tickers:
        f = get_fundamentals(conn, t)
        if not f or not f['divYield'] or f['divYield'] <= 0:
            continue
        if not f['eps'] or f['eps'] <= 0:
            continue
        if f['payoutRatio'] and f['payoutRatio'] > 0.80:
            continue
        raw = f['divYield']
        yield_pct = raw * 100 if raw < 0.20 else raw
        if yield_pct > 15:
            continue
        picks.append({
            'ticker': t, 'name': get_name(conn, t), 'sector': get_sector(conn, t),
            'divYield': round(yield_pct, 2),
            'payoutRatio': round(f['payoutRatio'] * 100, 1) if f['payoutRatio'] else None,
            'eps': round(f['eps'], 2), 'pe': round(f['pe'], 1) if f['pe'] else None,
            'price': get_price(conn, t),
            'rationale': f"Yield {yield_pct:.1f}%, Payout {round(f['payoutRatio']*100,0) if f['payoutRatio'] else '?'}%",
        })
    picks.sort(key=lambda x: x['divYield'], reverse=True)
    return {'picks': picks[:10]}


def screen_contrarian(conn):
    tickers = [r[0] for r in conn.execute(
        "SELECT DISTINCT ticker FROM fundamentals WHERE ticker LIKE '%.AX'"
    ).fetchall()]
    picks = []
    for t in tickers:
        f = get_fundamentals(conn, t)
        if not f or not f['eps'] or f['eps'] <= 0:
            continue
        if not f['pe'] or f['pe'] <= 0 or f['pe'] >= 15:
            continue
        if not f['pb'] or f['pb'] <= 0 or f['pb'] >= 1.5:
            continue
        if f['currentRatio'] and f['currentRatio'] < 1.0:
            continue
        graham = math.sqrt(22.5 * f['eps'] * f['bvps']) if f['bvps'] and f['bvps'] > 0 else None
        price = get_price(conn, t)
        discount = round(((graham - price) / price) * 100, 0) if graham and price and price > 0 else None
        picks.append({
            'ticker': t, 'name': get_name(conn, t), 'sector': get_sector(conn, t),
            'pe': round(f['pe'], 1), 'pb': round(f['pb'], 2),
            'grahamNumber': round(graham, 2) if graham else None,
            'grahamDiscount': discount, 'price': price,
            'eps': round(f['eps'], 2),
            'rationale': f"P/E {f['pe']:.1f}, P/B {f['pb']:.2f}, Graham disc {discount:+.0f}%" if discount else f"P/E {f['pe']:.1f}, P/B {f['pb']:.2f}",
        })
    picks.sort(key=lambda x: x.get('grahamDiscount') or -999, reverse=True)
    return {'picks': picks[:10]}


def screen_quant(conn):
    tickers = [r[0] for r in conn.execute(
        "SELECT DISTINCT ticker FROM fundamentals WHERE ticker LIKE '%.AX'"
    ).fetchall()]
    stocks = []
    for t in tickers:
        f = get_fundamentals(conn, t)
        if not f or not f['pb'] or f['pb'] <= 0 or not f['eps'] or f['eps'] <= 0:
            continue
        mom = get_momentum(conn, t)
        if mom is None:
            continue
        stocks.append({
            'ticker': t, 'name': get_name(conn, t), 'sector': get_sector(conn, t),
            'pb': f['pb'], 'roe': f['roe'], 'momentum': mom,
            'pe': round(f['pe'], 1) if f['pe'] else None,
            'price': get_price(conn, t),
            'eps': round(f['eps'], 2),
        })

    n = len(stocks)
    stocks.sort(key=lambda x: x['pb'])
    for i, s in enumerate(stocks): s['valueRank'] = i + 1
    stocks.sort(key=lambda x: x['momentum'] or 0, reverse=True)
    for i, s in enumerate(stocks): s['momentumRank'] = i + 1
    stocks.sort(key=lambda x: x['roe'] or 0, reverse=True)
    for i, s in enumerate(stocks): s['qualityRank'] = i + 1
    for s in stocks:
        s['compositeRank'] = s['valueRank'] + s['momentumRank'] + s['qualityRank']
        s['rationale'] = f"Value#{s['valueRank']} Mom#{s['momentumRank']}({s['momentum']:+.0f}%) Qual#{s['qualityRank']}(ROE {(s['roe'] or 0)*100:.0f}%)"

    stocks.sort(key=lambda x: x['compositeRank'])
    return {'picks': stocks[:10]}


def screen_damodaran(conn):
    tickers = [r[0] for r in conn.execute(
        "SELECT DISTINCT ticker FROM fundamentals WHERE ticker LIKE '%.AX'"
    ).fetchall()]
    stocks = []
    sector_pe = defaultdict(list)
    for t in tickers:
        f = get_fundamentals(conn, t)
        if not f or not f['eps'] or f['eps'] <= 0 or not f['pe'] or f['pe'] <= 0:
            continue
        sector = get_sector(conn, t)
        fcf_yield = (f['fcf'] / f['marketCap'] * 100) if f['fcf'] and f['marketCap'] and f['marketCap'] > 0 else None
        stocks.append({
            'ticker': t, 'name': get_name(conn, t), 'sector': sector,
            'pe': f['pe'], 'fcfYield': round(fcf_yield, 2) if fcf_yield else None,
            'price': get_price(conn, t), 'eps': round(f['eps'], 2),
        })
        sector_pe[sector].append(f['pe'])

    def median(lst):
        if not lst: return None
        lst = sorted(lst)
        n = len(lst)
        return lst[n // 2] if n % 2 else (lst[n // 2 - 1] + lst[n // 2]) / 2

    medians = {k: median(v) for k, v in sector_pe.items()}
    for s in stocks:
        pe_med = medians.get(s['sector'])
        pe_disc = ((pe_med - s['pe']) / pe_med * 100) if pe_med and s['pe'] else 0
        fcf = s['fcfYield'] or 0
        s['valueScore'] = round(pe_disc * 0.6 + fcf * 0.4, 1)
        s['sectorMedianPe'] = round(pe_med, 1) if pe_med else None
        s['rationale'] = f"P/E {s['pe']:.1f} (sector med {s['sectorMedianPe'] or '?'}), FCF yield {s['fcfYield'] or '?'}%"

    stocks.sort(key=lambda x: x['valueScore'], reverse=True)
    return {'picks': stocks[:10]}


def compute_diversification(all_picks):
    """Analyze sector diversification across selected stocks."""
    sector_counts = defaultdict(int)
    tickers = set()
    for pick in all_picks:
        sector_counts[pick.get('sector', 'Unknown')] += 1
        tickers.add(pick['ticker'])

    total = len(all_picks)
    unique = len(tickers)
    sectors = len(sector_counts)
    concentration = max(sector_counts.values()) / total * 100 if total > 0 else 0

    warnings = []
    for sector, count in sorted(sector_counts.items(), key=lambda x: x[1], reverse=True):
        pct = count / total * 100
        if pct > 30:
            warnings.append(f"High concentration in {sector} ({pct:.0f}% of picks)")

    if sectors < 4:
        warnings.append(f"Only {sectors} sectors represented — consider broader diversification")

    return {
        'totalPicks': total,
        'uniqueStocks': unique,
        'sectorCount': sectors,
        'sectorBreakdown': dict(sector_counts),
        'maxConcentration': round(concentration, 1),
        'warnings': warnings,
        'rating': 'Good' if sectors >= 5 and concentration <= 30 else 'Moderate' if sectors >= 3 else 'Poor',
    }


def compute_market_signals(conn):
    """Compute market-level indicators."""
    latest = get_latest_date(conn)

    # ASX 100 vs 200-day MA
    idx_prices = conn.execute(
        "SELECT adj_close FROM price_history WHERE ticker='^ATOI' AND date<=? ORDER BY date DESC LIMIT 200",
        (latest,)
    ).fetchall()

    asx_current = idx_prices[0][0] if idx_prices else None
    asx_ma200 = None
    asx_above_ma = None
    if len(idx_prices) >= 200:
        asx_ma200 = round(sum(p[0] for p in idx_prices if p[0]) / len([p for p in idx_prices if p[0]]), 0)
        asx_above_ma = asx_current > asx_ma200

    # 1-month and 3-month returns
    idx_1m = get_price(conn, '^ATOI', (datetime.strptime(latest, '%Y-%m-%d') - timedelta(days=30)).strftime('%Y-%m-%d'))
    idx_3m = get_price(conn, '^ATOI', (datetime.strptime(latest, '%Y-%m-%d') - timedelta(days=90)).strftime('%Y-%m-%d'))
    ret_1m = round(((asx_current - idx_1m) / idx_1m) * 100, 1) if asx_current and idx_1m else None
    ret_3m = round(((asx_current - idx_3m) / idx_3m) * 100, 1) if asx_current and idx_3m else None

    # Average P/E across all stocks (crude market valuation)
    pe_rows = conn.execute(
        "SELECT pe_ratio FROM fundamentals WHERE ticker LIKE '%.AX' AND pe_ratio > 0 AND pe_ratio < 100"
    ).fetchall()
    avg_pe = round(sum(r[0] for r in pe_rows) / len(pe_rows), 1) if pe_rows else None

    # Average dividend yield
    dy_rows = conn.execute(
        "SELECT dividend_yield FROM fundamentals WHERE ticker LIKE '%.AX' AND dividend_yield > 0 AND dividend_yield < 20"
    ).fetchall()
    avg_yield = round(sum(r[0] for r in dy_rows) / len(dy_rows), 2) if dy_rows else None

    signals = {
        'asOf': latest,
        'asx100': asx_current,
        'asx100Ma200': asx_ma200,
        'aboveMa200': asx_above_ma,
        'return1m': ret_1m,
        'return3m': ret_3m,
        'avgPe': avg_pe,
        'avgDivYield': avg_yield,
        'trendSignal': 'Bullish' if asx_above_ma else 'Bearish' if asx_above_ma is not None else 'Unknown',
    }

    # Commentary
    commentary = []
    if asx_above_ma:
        commentary.append("ASX 100 is above its 200-day moving average — the broad trend is up. Momentum strategies are favoured in this environment.")
    else:
        commentary.append("ASX 100 is below its 200-day moving average — caution warranted. The Padley strategy would be in cash. Value strategies may find opportunities in the pullback.")

    if ret_1m is not None:
        if ret_1m < -5:
            commentary.append(f"The market has dropped {ret_1m:.1f}% in the past month — short-term weakness. This could be a buying opportunity for value investors, or the start of a larger correction.")
        elif ret_1m > 5:
            commentary.append(f"The market has gained {ret_1m:+.1f}% in the past month — strong short-term momentum. Be cautious of chasing stocks at elevated levels.")

    if avg_pe:
        if avg_pe > 22:
            commentary.append(f"Average P/E ratio of {avg_pe} is above the historical average (~18). Stocks are relatively expensive — favour quality and cash flow over growth.")
        elif avg_pe < 15:
            commentary.append(f"Average P/E ratio of {avg_pe} is below the historical average (~18). Stocks look cheap — good environment for value strategies.")
        else:
            commentary.append(f"Average P/E ratio of {avg_pe} is near the historical average (~18). Market is neither cheap nor expensive.")

    commentary.append("Key macro watchpoints: RBA cash rate decisions, US Fed policy direction, iron ore and commodity prices (heavy ASX weighting), AUD/USD strength, and global trade tensions.")

    signals['commentary'] = commentary
    return signals


def main():
    conn = sqlite3.connect(DB_PATH)
    os.makedirs(os.path.join(OUTPUT_DIR, 'today'), exist_ok=True)
    latest = get_latest_date(conn)

    print(f"Screening stocks as of {latest}...\n")

    # Run all strategies
    strategies = {
        'padley_momentum': ('Padley Momentum', screen_padley),
        'dividend_income': ('Dividend Income', screen_dividend),
        'contrarian_value': ('Contrarian Deep Value', screen_contrarian),
        'quant_factors': ('Quantitative Factors', screen_quant),
        'damodaran_dcf': ('Damodaran Intrinsic Value', screen_damodaran),
    }

    all_results = {}
    all_picks = []

    for sid, (name, screener) in strategies.items():
        result = screener(conn)
        picks = result.get('picks', [])
        all_results[sid] = {
            'strategy': name,
            'asOf': latest,
            'picks': picks,
            'riskOff': result.get('riskOff', False),
            'signal': result.get('signal'),
        }
        all_picks.extend(picks)
        print(f"{name}: {len(picks)} picks" + (f" ({result.get('signal', '')})" if result.get('signal') else ''))
        for i, p in enumerate(picks[:5], 1):
            print(f"  {i}. {p['ticker']:10s} {p.get('rationale', '')}")
        if len(picks) > 5:
            print(f"  ... and {len(picks) - 5} more")

    # Diversification analysis
    diversification = compute_diversification(all_picks)
    print(f"\nDiversification: {diversification['uniqueStocks']} unique stocks across {diversification['sectorCount']} sectors")
    for w in diversification['warnings']:
        print(f"  ⚠ {w}")

    # Market signals
    signals = compute_market_signals(conn)
    print(f"\nMarket signals (as of {signals['asOf']}):")
    print(f"  ASX 100: {signals['asx100']:.0f} (200-day MA: {signals['asx100Ma200']}) — {signals['trendSignal']}")
    print(f"  1-month return: {signals['return1m']:+.1f}%  |  3-month: {signals['return3m']:+.1f}%")
    print(f"  Avg P/E: {signals['avgPe']}  |  Avg Div Yield: {signals['avgDivYield']}%")

    # Export
    output = {
        'asOf': latest,
        'strategies': all_results,
        'diversification': diversification,
        'marketSignals': signals,
    }
    path = os.path.join(OUTPUT_DIR, 'today', 'pick-today.json')
    with open(path, 'w') as f:
        json.dump(output, f, indent=2)
    print(f"\nExported to {path}")

    conn.close()


if __name__ == '__main__':
    main()
