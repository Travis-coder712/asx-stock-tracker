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

## Older ideas (from README roadmap history)

- Correlation & concentration tool — **DONE** in v1.8.0 (Portfolio Risk tab).
