# RetentionIQ

Product analytics dashboard for funnel drop-off, cohort retention, and feature adoption analysis.

## Project structure

```
backend/     FastAPI + SQLAlchemy + Alembic + Postgres
frontend/    Next.js 14 (App Router, TypeScript, Tailwind)
docs/        KPI formulas and architecture notes
```

## Prerequisites

- Node.js 18+
- Python 3.9+
- Embedded Postgres via `pgserver` (no brew/docker required for local dev)

## Quick start (local dev)

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python scripts/ensure_db.py      # starts embedded Postgres, writes .env
alembic upgrade head
python -u -m scripts.load_kaggle_data --csv-path data/raw/product.csv --truncate --refresh-aggregates
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Dashboard: http://localhost:3000
- API docs: http://localhost:8000/docs

## Dataset mapping (`backend/data/raw/product.csv`)

| DB field | CSV column |
|---|---|
| `user_id` | `user_id` |
| `event_name` | `title` (`banner_show`, `banner_click`, `order`) |
| `event_timestamp` | `time` |
| `acquisition_channel` | `site_version` (`mobile` / `desktop`) |
| `properties` | `order_id`, `page_id`, `product`, `target`, `site_version` |

Funnel stages: **signup** (first event) → **activation** (`banner_click`) → **paid conversion** (`order`).

## API endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/overview` | Activation rate, D7/D30 retention, top feature adoption |
| `GET /api/funnel` | Stage conversion + drop-off % |
| `GET /api/cohorts` | Cohort summary + heatmap data |
| `GET /api/features` | Weekly feature adoption series |
| `GET /api/channels` | Filter options (`mobile`, `desktop`) |
| `GET /api/channels/breakdown` | Per-channel activation + conversion comparison |
| `GET /api/meta` | Data freshness (event count, date range, aggregates status) |

All analytics endpoints accept optional `start_date`, `end_date`, and `channel` query params.

## KPI formulas

See [docs/KPI_FORMULAS.md](docs/KPI_FORMULAS.md) for every metric formula — written for portfolio/interview use.

## Architecture

```
CSV (product.csv)
    ↓ load_kaggle_data.py
Postgres (users + events)
    ↓ Alembic migrations + materialized views
FastAPI routers (overview, funnel, cohorts, features, channels)
    ↓ REST JSON
Next.js dashboard (Overview, Funnel, Cohorts, Features)
```

Each router file handles **one analytical concept** (per project rules).

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Vercel + Railway/Render + Neon setup.

## Portfolio highlights

- **SQL-first analytics** — cohorts, funnels, and adoption computed in Postgres CTEs and materialized views, not Python loops
- **Insight panels** — every page includes grounded "What this means" + "Recommended action" copy tied to real numbers
- **Channel comparison** — mobile vs desktop activation and conversion side-by-side
- **Sub-500ms aggregates** — materialized views + cached stats for dashboard loads on 8.4M events

## Local dev notes

- Embedded Postgres data lives at `/tmp/retentioniq_pgdata` (path has no spaces — required by pgserver).
- Full CSV load (~8.4M rows) takes ~45–60 minutes; the dashboard works with partial data while loading.
- Run `python scripts/refresh_aggregates.py` after the load completes.
- Insight panels are grounded in computed metrics, not generic filler copy.

## Signature UI elements

- **Retention heatmap** — row/column scrub on hover with cross-highlight
- **Funnel chart** — animated user-flow drop-off visualization
