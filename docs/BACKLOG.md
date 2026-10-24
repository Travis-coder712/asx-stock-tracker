# Backlog

Ideas parked for later, in the "build the interactive thing to understand the thing" spirit.
Not committed to a timeline — picked up when there's appetite.

## Paused 2026-07-30 (after v1.8.0 Portfolio Risk tab)

- **Effective-number-of-bets metric** — collapse the Portfolio Risk correlation matrix into a
  single headline number: "you think you have 5 strategies / 29 holdings; you effectively have ~N
  independent bets." (e.g. via the inverse Herfindahl of the eigenvalues, or 1 / average pairwise
  correlation.) Surface it as a stat tile on the Portfolio Risk tab.

- **Position-sizing overlay** — apply a fractional-Kelly / volatility-based (equal-risk) sizing
  rule to the existing strategy holdings and compare the resulting weights and risk against the
  current equal-dollar weighting. Ties Module 9 (Position Sizing) to the real portfolios, the way
  the Portfolio Risk tab ties Module 9's correlation lesson to them.

- **Volatility term-structure explorer** — visualise Module 10's event vol: implied vol by expiry
  with the pre-event bump, and how the crush flattens the curve after the event.

## Data / pipeline (from the 2026-10-24 refresh)

- **Scheduled refresh (GitHub Actions)** — the highest-value next step. A weekly cron workflow:
  import → `verify_prices.py` → `build_main_portfolios` → periods → exports → version bump → commit,
  which auto-deploys. Free (no Cloudflare). Needs the SQLite DB between runs: rebuild from scratch
  weekly (re-pull full history), or cache it as a workflow artifact / in R2. Would have caught today's
  silent staleness.
- **Reliable fundamentals source** — yfinance has no point-in-time fundamentals and no franking, and
  fails silently mid-batch. EODHD (~US$20/mo) would give consistent ASX fundamentals + franking. The
  `fundamentals_history` archive (added 2026-10-24) now captures a dated snapshot each refresh, so
  future first-time period screens can be point-in-time — but it only accumulates going forward.
- **As-of fundamentals in screens** — new periods are currently screened with *current* fundamentals
  (unavoidable until the archive has history at that date). Wire `run_all_periods` to read
  `fundamentals_history` as-of the buy date once the archive covers it.
- **Optional Claude/Cloudflare layer** — a Lens-style weekly commentary / "why did X move?" ask box
  via a Cloudflare Worker proxying Claude. Nice-to-have, not needed for the core.

## Older ideas (from README roadmap history)

- Correlation & concentration tool — **DONE** in v1.8.0 (Portfolio Risk tab).
- Look-ahead instability (picks changed on every refresh) — **FIXED 2026-10-24 (v1.10.0)** via the
  `frozen_picks` ledger (`pipeline/models/freeze.py` + `build_main_portfolios.py`); seeded from
  `pipeline/data/frozen_picks_seed.json`. Picks are screened once and re-priced forward only.
