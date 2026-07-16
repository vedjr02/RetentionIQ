# Deployment Guide

RetentionIQ deploys as a **single Vercel project** (frontend + FastAPI backend) with **Neon Postgres**.

```
Vercel project
  ├── frontend/   →  https://your-app.vercel.app/
  └── backend/    →  https://your-app.vercel.app/api/*
Neon Postgres   →  DATABASE_URL env var
```

| Service | Host | Notes |
|---|---|---|
| Frontend + API | [Vercel](https://vercel.com) | Root `vercel.json` multi-service |
| Postgres | [Neon](https://neon.tech) | Free tier: use `--max-chunks 2` on load |

See also [docs/DATABASE.md](DATABASE.md) for local vs production database setup.

## 1. Provision Postgres (Neon)

1. Create a Neon project and connect it via Vercel Storage integration.
2. Ensure `DATABASE_URL` is set on the Vercel project (Production + Preview).
3. The backend auto-converts `postgresql://` to `postgresql+psycopg://`.

**Free tier (512 MB):** load a demo subset only:

```bash
cd backend && source .venv/bin/activate
export DATABASE_URL="postgresql+psycopg://..."
alembic upgrade head
python scripts/load_kaggle_data.py \
  --csv-path data/raw/product.csv \
  --truncate \
  --max-chunks 2 \
  --refresh-aggregates
```

## 2. Deploy to Vercel

1. Import `vedjr02/RetentionIQ` from GitHub.
2. Vercel detects root `vercel.json` (no manual root directory needed).
3. Environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | From Neon integration |
| `NEXT_PUBLIC_API_URL` | Leave **empty** (same-origin `/api/*`) |
| `CORS_ORIGINS` | `https://your-app.vercel.app` |

4. Deploy. Backend uses Python 3.12 (`backend/.python-version`).

## 3. Verify

```bash
chmod +x scripts/smoke_test.sh
./scripts/smoke_test.sh https://your-app.vercel.app
```

Or manually:

- `GET /health` → `{"status":"ok","database":"connected"}`
- `GET /api/overview` → KPIs + funnel + channels in one response
- Open the Vercel URL → all four dashboard pages load

## Alternative: split frontend + API

If you prefer separate hosts:

| Component | Host |
|---|---|
| Frontend | Vercel (`frontend/` root) |
| API | Railway/Render (`backend/Dockerfile`) |
| Postgres | Neon |

Set `NEXT_PUBLIC_API_URL` to your Railway/Render API URL and `CORS_ORIGINS` on the API.

## Refreshing aggregates

After loading new data:

```bash
python scripts/refresh_aggregates.py
```

## Local vs production

| | Local | Production |
|---|---|---|
| Postgres | Embedded via `pgserver` | Neon |
| Data load | Full 8.4M events | `--max-chunks 2` on free tier |
| Frontend API URL | `http://localhost:8000` | Same-origin (empty env) |
| Start command | `./scripts/start_local.sh` | Vercel deploy |
