# Data Refresh Runbook

Run these commands from the project root (`/Users/travishughes/Claude/asx-stock-tracker`).

## Weekly refresh (prices only)

```bash
python3 pipeline/importers/import_prices.py --all --start 2023-01-01
python3 pipeline/importers/verify_prices.py          # MUST pass — see gotcha below
python3 -m pipeline.models.build_main_portfolios     # re-price FROZEN main picks + archive fundamentals
python3 -m pipeline.models.compute_tsr
python3 -m pipeline.models.run_all_periods           # re-prices frozen periods; screens+freezes any NEW period once
python3 -m pipeline.models.compute_hold_periods
python3 pipeline/exporters/export_json.py
python3 -m pipeline.exporters.export_risk
python3 -m pipeline.exporters.export_stress     # correction stress-test (beta, drawdown, 200MA signal)
python3 -m pipeline.exporters.export_holdings_flow  # holdings bump-chart (per-stock period returns/ranks)
# then set both versions (export_json resets metadata version to 0.1.0):
#   frontend/package.json "version"  AND  frontend/public/data/metadata.json "version" + "stockCount"
```

> **Picks are FROZEN (fixed 2026-10-24).** Strategy screens use *current* fundamentals, so
> re-screening historical buy dates used to rewrite the past and drift the "since 2024" numbers on
> every refresh. Now each pick-set is screened **once** and stored in the `frozen_picks` table
> (seeded from `pipeline/data/frozen_picks_seed.json`); refreshes only re-price forward. Do **not**
> re-run the five strategy modules (`padley_momentum` etc.) on a refresh — they re-screen. Use
> `build_main_portfolios` instead. The modules remain only for first-time screening.

> **⚠️ yfinance refresh gotcha.** The importer uses `INSERT OR IGNORE`, so (a) tickers that fail
> mid-batch stay silently stale, and (b) post-split names get an `adj_close` discontinuity that
> never self-corrects. `verify_prices.py` flags any held ticker not fresh to the latest date or with
> a suspicious jump; if it reports problems, delete+refetch those tickers (full history, `2023-01-01`)
> rather than appending. A stale holding also makes the snapshot understate that strategy.

## After adding new ASX 100 constituent lists

1. Add the list to `pipeline/data/asx100_constituents.py`
2. Fetch data for any new tickers: `python3 pipeline/importers/import_prices.py --ticker NEW.AX --start 2023-01-01`
3. Recompute peer rankings: `python3 -m pipeline.models.compute_peer_tsr`
4. Re-export: `python3 pipeline/exporters/export_json.py && python3 -m pipeline.exporters.export_risk`

## After rebalance (every 6 months)

The `run_all_periods.py` script automatically handles rebalancing across all periods. Just run the weekly refresh commands above.

## Build and deploy

```bash
cd frontend
npx tsc -b          # type-check
npm run build       # build
# Push to main — GitHub Actions deploys automatically
```

## Version sync

Both files must match:
- `frontend/package.json` → `"version"`
- `frontend/public/data/metadata.json` → `"version"`
