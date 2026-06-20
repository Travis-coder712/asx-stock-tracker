# ASX Stock Tracker

Five investment philosophies, each with a hypothetical $5,000 stake on ASX stocks — auto-picked by strategy rules with manual override, tracked over six months. Plus an AGL Energy TSR tracker comparing total shareholder return against the S&P/ASX 100.

**Live:** [travis-coder712.github.io/asx-stock-tracker](https://travis-coder712.github.io/asx-stock-tracker/)

## Strategies

| # | Strategy | Inspired by | Approach |
|---|---|---|---|
| 1 | **Padley Momentum** | Marcus Padley / Marcus Today | Trend-following with capital preservation. Screen by earnings momentum + ROE, rank by 12-month price momentum. Go to cash when ASX 200 breaks below 200-day MA. |
| 2 | **Damodaran Intrinsic Value** | Aswath Damodaran / NYU Stern | DCF valuation with narrative-to-numbers. Score by discount-to-intrinsic-value, supplemented by relative valuation (P/E, EV/EBITDA vs peers). |
| 3 | **Quantitative Factors** | Fama-French factor research | Multi-factor model: value (low P/B), momentum (12-1 month returns), quality (high ROE, low debt), low volatility. Equal-weight top-ranked. |
| 4 | **Dividend Income** | Australian income investing | High-yield with franking credit advantage. Rank by grossed-up yield, filter by payout ratio <80%, DPS growth >0 over 3 years. |
| 5 | **Contrarian Deep Value** | Benjamin Graham / Warren Buffett | Graham Number screen, P/B <1, current ratio >1.5, five years of positive earnings. Buy below intrinsic value. |

Each strategy auto-selects stocks from the ASX using coded screening rules. Manual overrides let you swap stocks in or out.

## AGL TSR Tracker

Tracks AGL Energy (ASX:AGL) total shareholder return — price appreciation plus reinvested dividends — against the S&P/ASX 100 Accumulation Index over rolling 4-year periods starting 1 July 2023, 2024, 2025, and 2026.

## Learning Module

Built into the app at `/learn` — a 7-module curriculum covering investing foundations and the thinking behind each strategy.

| # | Module | What you'll learn |
|---|---|---|
| 1 | **Investing 101** | What shares are, how the ASX works, risk vs return, compound interest, diversification, dividends and franking, common traps (FOMO, panic selling, overtrading), what to watch (P/E, earnings, ex-div dates). |
| 2 | **Momentum & Technical Analysis** | Why trends persist, moving averages, RSI, Marcus Padley's approach, when to go to cash, momentum reversal risks. |
| 3 | **Intrinsic Valuation** | What a stock is "worth", DCF in plain English, narrative-to-numbers, relative valuation (P/E, EV/EBITDA), margin of safety. |
| 4 | **Factor Investing** | The Big Five factors (value, size, momentum, quality, low vol), how scoring models work, academic evidence, backtesting pitfalls. |
| 5 | **Dividend & Income Investing** | Franking credits explained, grossed-up yield, dividend sustainability, dividend traps, interactive franking calculator. |
| 6 | **Value Investing** | Graham's margin of safety, the Graham Number, Buffett's evolution, contrarian thinking, value traps. |
| 7 | **What to Watch Out For** | Cognitive biases, media traps, broker conflicts, CGT and tax implications, the cost of fees, when to sell, keeping a decision journal. |

Each module includes interactive exercises — screeners on live ASX data, calculators, and worked examples using the app's own portfolio data.

## Architecture

```
asx-stock-tracker/
├── frontend/          React/Vite PWA (dark theme, mobile-first)
│   ├── public/data/   Static JSON consumed by the frontend
│   └── src/           React components
├── pipeline/          Python data pipeline
│   ├── importers/     Fetch data from yfinance
│   ├── exporters/     Export SQLite → JSON
│   └── models/        Strategy screening models
├── database/          SQLite DB (gitignored)
├── docs/              Session handoff docs
└── CLAUDE.md          Project documentation
```

Same pattern as [AURES](https://github.com/Travis-coder712/aures-db): Python importers populate SQLite, exporters emit static JSON, React frontend consumes it. Deployed to GitHub Pages via Actions.

## Data

- **Price + dividend history** via [yfinance](https://pypi.org/project/yfinance/) (free, `.AX` suffix for ASX)
- **Fundamentals** (P/E, P/B, ROE, dividend yield, etc.) via yfinance
- **ASX 100 Total Return Index** for TSR benchmarking

## Getting started

```bash
# Set up the database
python3 pipeline/setup_db.py

# Import stock data
python3 pipeline/importers/import_prices.py --agl-only   # just AGL
python3 pipeline/importers/import_prices.py --all         # full ASX 100

# Export to JSON for the frontend
python3 pipeline/exporters/export_json.py

# Run the frontend
cd frontend && npm install && npm run dev
```

## Status

v0.1.0 — scaffolding. Strategy models and live data coming soon.

---

Built with [Claude Code](https://claude.ai/code).
