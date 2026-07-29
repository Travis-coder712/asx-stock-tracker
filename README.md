# ASX Stock Tracker

Five investment philosophies tested on the ASX with hypothetical portfolios — auto-picked by strategy rules, rebalanced every 6 months, tracked with real data. Includes a macro view, "Pick Today" portfolio builder, AGL peer analysis, and a 10-module investing curriculum with interactive simulators.

**Live:** [travis-coder712.github.io/asx-stock-tracker](https://travis-coder712.github.io/asx-stock-tracker/)

## App Tabs

### Strategies
Five investment strategies, each starting with a hypothetical $5,000 stake, tracked across rolling 6-month periods with reinvestment. Expandable holdings detail shows exactly why each stock was picked (momentum %, ROE, P/E, Graham discount, FCF yield etc). Includes a comparison dashboard with all 5 strategies on one chart, period breakdown drill-down, and "What If You Held Longer?" analysis (6/12/18/24 months).

| # | Strategy | Inspired by | Cumulative Return |
|---|---|---|---|
| 1 | **Padley Momentum** | Marcus Padley / Marcus Today | +64.0% |
| 2 | **Quantitative Factors** | Fama-French factor research | +60.7% |
| 3 | **Dividend Income** | Australian income investing | +13.0% |
| 4 | **Contrarian Deep Value** | Benjamin Graham / Warren Buffett | +6.5% |
| 5 | **Damodaran Intrinsic Value** | Aswath Damodaran / NYU Stern | -8.4% |

### Pick Today
Live screening against current data — what each strategy would select right now.
- **Macro View** — ASX 100 vs 200-day MA (Bullish/Bearish), 1m/3m returns, market P/E and yield, commentary on strategy implications and macro watchpoints
- **Strategy toggle** — activate/deactivate any combination of strategies
- **Stock checkboxes** — exclude individual stocks from your selection
- **Portfolio Diversification** — sector breakdown bars, concentration warnings, overall rating

### AGL Analysis
AGL Energy performance vs S&P/ASX 100 peer group — TSR (price + reinvested dividends) measured from 1 July each year, with full peer ranking table across 92+ ASX 100 constituents. Period selector for FY24/FY25/FY26.

### Portfolio Risk
Analyses what happens if you ran **all five strategies together** — the diversification the five separate portfolios hide.
- **Cross-strategy overlap** — which stocks are held in more than one strategy (e.g. FMG in four) and their combined weight
- **Strategy correlation heatmap** — real daily-return correlations between the five strategies (they average ~0.67 — far from five independent bets)
- **Combined sector concentration** — where an equal split across the five actually lands, with flags over 20%
- **Stock-by-stock correlation** — the full holdings correlation matrix
- Built from `pipeline/exporters/export_risk.py` → `public/data/risk/portfolio-risk.json`

### Learn
10-module investing curriculum with 46 lessons, interactive calculators/simulators, and curated resources:

| # | Module | Lessons |
|---|---|---|
| 1 | **Investing 101** | 7 — shares, ASX, risk/return, compounding, diversification, franking, traps |
| 2 | **Momentum & Technical Analysis** | 4 — why momentum works, key indicators, Padley's approach, risks |
| 3 | **Intrinsic Valuation** | 4 — DCF in plain English, narrative-to-numbers, relative valuation |
| 4 | **Factor Investing** | 3 — Big Five factors, scoring models, crowding risks |
| 5 | **Dividend & Income** | 3 — franking calculator, sustainability tests, dividend traps |
| 6 | **Value Investing** | 3 — Graham Number calculator, Buffett's evolution, value traps |
| 7 | **What to Watch Out For** | 4 — cognitive biases, media trap, tax/fees, risk profile quiz |
| 8 | **Options & Volatility** | 6 — options primer, delta-hedging, gamma vs theta, realised vs implied vol, frequency & path dependency, ASX reality check + **gamma scalping simulator** |
| 9 | **Position Sizing & Risk of Ruin** | 6 — sizing beats selection, expectancy, the Kelly criterion, fractional Kelly & ruin, volatility/correlation sizing, a sane retail rule + **position sizing simulator** |
| 10 | **Vega & Vol Crush** | 6 — vega, event vol & term structure, the vol crush, right-on-direction-still-lose, which side to be on, ASX reality check + **vol crush simulator** |

Three interactive simulators anchor the advanced modules:

- **Gamma Scalping Simulator** (Module 8) — runs a Black-Scholes gamma calculation over a simulated price path and splits the P&L into *gamma harvested* vs *theta paid* vs *transaction costs*. Drag implied vol, realised vol, days-to-expiry, hedge frequency and cost-per-hedge, then roll a "New path" to see how much of long-vol P&L is genuine edge and how much is path luck.
- **Position Sizing Simulator** (Module 9) — a Monte-Carlo of 400 equity curves for a repeated bet, with a live Kelly calculator. Shows how the *same* edge compounds to wealth at a sane size and to ruin when over-bet — the median outcome peaks near Kelly then collapses as the wipe-out rate climbs.
- **Vol Crush Simulator** (Module 10) — a Black-Scholes option held through an event. Plots value-vs-move with and without the implied-vol collapse, marks the premium paid and breakeven move, and decomposes P&L into *spot move (delta/gamma)* vs *theta* vs *vega crush* — making concrete how you can call the direction right and still lose.

## Architecture

```
asx-stock-tracker/
├── frontend/              React/Vite PWA (dark theme, mobile-first)
│   ├── public/data/       Static JSON consumed by the frontend
│   │   ├── portfolios/    Per-strategy snapshots and holdings
│   │   ├── periods/       Multi-period tracking data + hold analysis
│   │   ├── tsr/           AGL TSR + peer rankings
│   │   ├── today/         Pick Today screening results
│   │   ├── risk/          Portfolio-risk (overlap, correlations, concentration)
│   │   └── charts/        Price history data
│   └── src/
│       ├── App.tsx           Main app with tab navigation
│       ├── Dashboard.tsx     Strategy comparison dashboard
│       ├── AglAnalysis.tsx   AGL peer analysis
│       ├── PickToday.tsx     Live screening + macro + portfolio builder
│       ├── PortfolioRisk.tsx Cross-strategy overlap + correlation heatmaps
│       └── learn/            10-module curriculum + interactive simulators
├── pipeline/
│   ├── importers/         Fetch data from yfinance
│   ├── exporters/         Export SQLite → JSON
│   ├── models/            Strategy screening + TSR + peer ranking
│   └── data/              ASX 100 constituent lists (2023-2025)
├── database/              SQLite DB (gitignored)
├── docs/                  DATA_REFRESH.md runbook
└── CLAUDE.md              Project documentation
```

## Data

- **135 ASX stocks** with price + dividend + fundamentals data from Jan 2023
- **Price history** via [yfinance](https://pypi.org/project/yfinance/) (free, `.AX` suffix)
- **ASX 100 constituents** as at 30 June 2023, 2024, and 2025 for peer ranking
- **ASX 100 Index** (`^ATOI`) for trend signals and price comparison

## Getting started

```bash
# Set up database and seed strategies
python3 pipeline/setup_db.py

# Import stock data (takes ~5 minutes for all ASX 100)
python3 pipeline/importers/import_prices.py --all --start 2023-01-01

# Run all models
python3 -m pipeline.models.compute_tsr
python3 -m pipeline.models.run_all_periods
python3 -m pipeline.models.compute_hold_periods
python3 -m pipeline.models.compute_peer_tsr
python3 -m pipeline.models.pick_today

# Export to JSON
python3 pipeline/exporters/export_json.py
python3 -m pipeline.exporters.export_risk   # portfolio-risk (overlap, correlations)

# Run frontend
cd frontend && npm install && npm run dev
```

## Data refresh

See [docs/DATA_REFRESH.md](docs/DATA_REFRESH.md) for the full runbook. Quick version:

```bash
python3 pipeline/importers/import_prices.py --all --start 2023-01-01
python3 -m pipeline.models.compute_tsr
python3 -m pipeline.models.run_all_periods
python3 -m pipeline.models.compute_hold_periods
python3 -m pipeline.models.compute_peer_tsr
python3 -m pipeline.models.pick_today
python3 pipeline/exporters/export_json.py
python3 -m pipeline.exporters.export_risk   # portfolio-risk (overlap, correlations)
```

## Where this lives

| Location | URL / Path | How to update |
|---|---|---|
| **Live app** | [travis-coder712.github.io/asx-stock-tracker](https://travis-coder712.github.io/asx-stock-tracker/) | Push to `main` — GitHub Actions deploys automatically |
| **GitHub repo** | [Travis-coder712/asx-stock-tracker](https://github.com/Travis-coder712/asx-stock-tracker) | Standard git workflow |
| **Travis Dashboard** | `~/Studio/Dashboard.html` | Edit HTML directly, no build step |
| **Studio (public)** | [travis-coder712.github.io/studio](https://travis-coder712.github.io/studio/) | Edit `~/Studio/studio-public/index.html`, push to `main` |
| **Local dev** | `http://localhost:5174/asx-stock-tracker/` | `cd frontend && npm run dev` |

## Status

v1.8.0 — 5 strategies, 135 stocks, macro view, portfolio builder, a **Portfolio Risk** tab (cross-strategy overlap + real return-correlation heatmaps), and a 10-module / 46-lesson curriculum with three interactive derivatives/risk simulators (gamma scalping, position sizing, vol crush).

## Roadmap

The advanced curriculum now covers the two things a stock-picker most often lacks — an understanding of **volatility as a tradeable quantity** (Modules 8 & 10) and a disciplined approach to **how much to bet** (Module 9) — and the **Portfolio Risk** tab turns Module 9's correlation/concentration warning into a live check against the real portfolios. Possible next steps, in the same "build the interactive thing to understand the thing" spirit:

- **Volatility term-structure explorer** — visualise Module 10's event vol: implied vol by expiry with the pre-event bump, and how the crush flattens it.
- **Position-sizing overlay** — apply a fractional-Kelly / volatility-based sizing rule to the existing strategy holdings and compare against equal-dollar weighting.
- **Effective-number-of-bets metric** — collapse the Portfolio Risk correlation matrix into a single "you think you have 5 bets; you effectively have N" number.

---

Built with [Claude Code](https://claude.ai/code).
