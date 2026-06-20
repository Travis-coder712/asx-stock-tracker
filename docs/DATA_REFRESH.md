# Data Refresh Runbook

Run these commands from the project root (`/Users/travishughes/Claude/asx-stock-tracker`).

## Weekly refresh (prices only)

```bash
python3 pipeline/importers/import_prices.py --all --start 2023-01-01
python3 -m pipeline.models.compute_tsr
python3 -m pipeline.models.run_all_periods
python3 -m pipeline.models.compute_hold_periods
python3 pipeline/exporters/export_json.py
```

## After adding new ASX 100 constituent lists

1. Add the list to `pipeline/data/asx100_constituents.py`
2. Fetch data for any new tickers: `python3 pipeline/importers/import_prices.py --ticker NEW.AX --start 2023-01-01`
3. Recompute peer rankings: `python3 -m pipeline.models.compute_peer_tsr`
4. Re-export: `python3 pipeline/exporters/export_json.py`

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
