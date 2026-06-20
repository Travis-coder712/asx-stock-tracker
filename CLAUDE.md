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

# Export to JSON for frontend
python pipeline/exporters/export_json.py

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
