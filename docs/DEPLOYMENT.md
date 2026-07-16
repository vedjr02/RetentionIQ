# Deployment Guide

RetentionIQ splits across three services in production:

| Service | Recommended host | Notes |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) | Next.js 14 App Router |
| API | [Railway](https://railway.app) or [Render](https://render.com) | FastAPI + Docker |
| Postgres | [Neon](https://neon.tech) or [Supabase](https://supabase.com) | Managed Postgres |

## 1. Provision Postgres

Create a database and note the connection string. Use the `postgresql+psycopg://` prefix for SQLAlchemy.

## 2. Deploy the API

### Option A — Docker (Railway / Render)

```bash
cd backend
docker build -t retentioniq-api .
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg://..." \
  -e CORS_ORIGINS="https://your-app.vercel.app" \
  retentioniq-api
```

### Option B — Direct deploy

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python -m scripts.load_kaggle_data --csv-path data/raw/product.csv --refresh-aggregates
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**One-time data setup** (run against production `DATABASE_URL`):

```bash
alembic upgrade head
python -m scripts.load_kaggle_data --csv-path data/raw/product.csv --refresh-aggregates
```

You only need to load data once per database. Redeploying the API does not require re-loading.

## 3. Deploy the frontend (Vercel)

1. Import the repo and set the root directory to `frontend`.
2. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your deployed API URL (e.g. `https://retentioniq-api.railway.app`)
3. Deploy.

## 4. Configure CORS

Set `CORS_ORIGINS` on the API to your Vercel URL:

```
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
```

## 5. Verify

- `GET https://your-api/health` → `{"status":"ok","database":"connected"}`
- `GET https://your-api/api/overview` → KPI JSON in < 500ms
- Open the Vercel URL → all four dashboard pages load with real data

## Local vs production

| | Local | Production |
|---|---|---|
| Postgres | Embedded via `pgserver` (`ensure_db.py`) | Managed Postgres |
| Data load | `load_kaggle_data.py` | Same script, run once |
| MV refresh | `refresh_aggregates.py` | Same script, after load |
| Frontend API URL | `http://localhost:8000` | `NEXT_PUBLIC_API_URL` env var |

## Refreshing aggregates

After loading new data or on a schedule:

```bash
python scripts/refresh_aggregates.py
```

This refreshes all materialized views and updates the `dashboard_stats` cache used by `/api/meta`.
