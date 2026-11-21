"""The ONE definition of how a comparator TSR is measured.

Both the LTI tracking exporter and the peer-ranking model read from here, so
they cannot drift apart. They did drift once: lti-tracking.json moved to the
plan's 30-day VWAP basis on 2026-11-21 while compute_peer_tsr stayed on spot
prices, and the LTI page reads its percentiles from the peer-ranking files —
so the fix would have shown up nowhere.

The basis is set by the AGL LTI Offer s4.1:

    "the price of the relevant entity's securities as at 30 June 2023 and
     30 June 2027 will be calculated by reference to the VWAP of those
     securities sold on the ASX in the thirty calendar days up to and
     including 30 June 2023 and 30 June 2027"

Volume-weighting the ADJUSTED close approximates "VWAP of traded prices with
dividends reinvested at the ex-date close". The two differ only where an
ex-dividend date falls inside the 30-day window, and then only slightly.
"""

import bisect
import datetime


def window_start(iso, days=30):
    """First date of the `days`-CALENDAR-day window ending at (and including) iso."""
    return (datetime.date.fromisoformat(iso) - datetime.timedelta(days=days - 1)).isoformat()


def day_before(iso):
    return (datetime.date.fromisoformat(iso) - datetime.timedelta(days=1)).isoformat()


def load_series(conn, ticker, period_start, lookback_days=30):
    """(dates, adj_close, close, volume) from `lookback_days` before period_start.

    The pre-period rows are what make the opening VWAP window available; without
    them the opening price is a single spot print on the first trading day.
    """
    rows = conn.execute(
        "SELECT date, adj_close, close, volume FROM price_history "
        "WHERE ticker=? AND date >= date(?, ?) AND adj_close IS NOT NULL "
        "ORDER BY date",
        (ticker, period_start, f'-{lookback_days} days'),
    ).fetchall()
    if not rows:
        return None
    return ([r[0] for r in rows], [r[1] for r in rows],
            [r[2] for r in rows], [r[3] or 0 for r in rows])


def spot(series, d, idx=1):
    if not series:
        return None
    pos = bisect.bisect_right(series[0], d) - 1
    return series[idx][pos] if pos >= 0 else None


def vwap(series, d, idx=1, days=30):
    """Volume-weighted average of series[idx] over the `days` calendar days to d.

    Falls back to the spot value when no volume is recorded in the window, so a
    thinly traded or suspended name still gets a price instead of silently
    dropping out of the comparator — a missing name changes the denominator of
    a vesting calculation, which is never a safe default.
    """
    if not series:
        return None
    hi = bisect.bisect_right(series[0], d)
    lo = bisect.bisect_left(series[0], window_start(d, days))
    if hi <= lo:
        return spot(series, d, idx)
    num = den = 0.0
    for k in range(lo, hi):
        v, p = series[3][k], series[idx][k]
        if v and p:
            num += p * v
            den += v
    return num / den if den else spot(series, d, idx)


def tsr_pct(series, period_start, at, days=30):
    """Relative TSR in percent, both endpoints on the 30-day VWAP."""
    if not series:
        return None
    p0 = vwap(series, day_before(period_start), 1, days)
    p1 = vwap(series, at, 1, days)
    if not p0 or not p1 or p0 <= 0:
        return None
    return (p1 / p0 - 1) * 100
