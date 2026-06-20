# ASX Stock Tracker

Five investment philosophies tested on the ASX with hypothetical portfolios — auto-picked by strategy rules, rebalanced every 6 months, tracked with real data. Includes a macro view, "Pick Today" portfolio builder, AGL peer analysis, and a 7-module investing curriculum.

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

### Learn
7-module investing curriculum with 28 lessons, interactive calculators, and curated resources:

| # | Module | Lessons |
|---|---|---|
| 1 | **Investing 101** | 7 — shares, ASX, risk/return, compounding, diversification, franking, traps |
| 2 | **Momentum & Technical Analysis** | 4 — why momentum works, key indicators, Padley's approach, risks |
| 3 | **Intrinsic Valuation** | 4 — DCF in plain English, narrative-to-numbers, relative valuation |
| 4 | **Factor Investing** | 3 — Big Five factors, scoring models, crowding risks |
| 5 | **Dividend & Income** | 3 — franking calculator, sustainability tests, dividend traps |
| 6 | **Value Investing** | 3 — Graham Number calculator, Buffett's evolution, value traps |
| 7 | **What to Watch Out For** | 4 — cognitive biases, media trap, tax/fees, risk profile quiz |

## Architecture

```
asx-stock-tracker/
├── frontend/              React/Vite PWA (dark theme, mobile-first)
│   ├── public/data/       Static JSON consumed by the frontend
│   │   ├── portfolios/    Per-strategy snapshots and holdings
│   │   ├── periods/       Multi-period tracking data + hold analysis
│   │   ├── tsr/           AGL TSR + peer rankings
│   │   ├── today/         Pick Today screening results
│   │   └── charts/        Price history data
│   └── src/
│       ├── App.tsx         Main app with tab navigation
│       ├── Dashboard.tsx   Strategy comparison dashboard
│       ├── AglAnalysis.tsx AGL peer analysis
│       ├── PickToday.tsx   Live screening + macro + portfolio builder
│       └── learn/          7-module curriculum
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

v1.4.0 — all phases complete plus Pick Today. 5 strategies, 135 stocks, 28 lessons, macro view, portfolio builder.

---

Built with [Claude Code](https://claude.ai/code).
