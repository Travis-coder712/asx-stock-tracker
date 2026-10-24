# ASX Stock Tracker

Read `docs/SESSION_OPENER.md` at the start of every session (when it exists).

## Architecture

- **Frontend**: React/Vite PWA at `frontend/`. Dark theme, mobile-first. Deployed to GitHub Pages.
- **Pipeline**: Python scripts at `pipeline/`. SQLite DB → JSON export to `frontend/public/data/`.
- **Database**: SQLite at `database/asx_tracker.db` (gitignored).

Same pattern as AURES: importers populate SQLite, exporters emit static JSON for the frontend.

## Key commands

```bash
# Set up database
python pipeline/setup_db.py

# Import stock data (start with AGL)
python pipeline/importers/import_prices.py --agl-only
python pipeline/importers/import_prices.py --all    # full ASX 100

# Refresh portfolios from FROZEN picks (re-price forward; do NOT re-run strategy modules)
python pipeline/importers/verify_prices.py        # data sanity — must pass
python -m pipeline.models.build_main_portfolios   # main buy-and-hold, re-priced forward
python -m pipeline.models.run_all_periods         # rebalanced periods (frozen-aware)

# Export to JSON for frontend
python pipeline/exporters/export_json.py
python -m pipeline.exporters.export_risk   # portfolio-risk (overlap, correlations) — run after export_json

# Frontend dev
cd frontend && npm run dev

# Build + type-check
cd frontend && npx tsc -b && npm run build
```

## Rules

- Bump `frontend/package.json` version AND `frontend/public/data/metadata.json` version in sync.
- `npx tsc -b` before pushing — CI is stricter than vite build.
- Don't commit `database/asx_tracker.db` — gitignored.
- Don't `git add .` — stage specific files.
