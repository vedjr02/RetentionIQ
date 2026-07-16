# Database Setup — RetentionIQ

RetentionIQ uses **PostgreSQL** for all analytics data. Where that Postgres lives depends on the environment.

## Architecture overview

```
┌─────────────────┐     NEXT_PUBLIC_API_URL      ┌─────────────────┐     DATABASE_URL     ┌─────────────────┐
│  Vercel         │  ─────────────────────────►  │  Railway/Render │  ─────────────────►  │  Neon/Supabase  │
│  (Next.js UI)   │                              │  (FastAPI API)  │                      │  (Postgres)     │
└─────────────────┘                              └─────────────────┘                      └─────────────────┘
```

| Component | Local dev | Production |
|---|---|---|
| **Frontend** | `localhost:3000` | Vercel |
| **API** | `localhost:8000` | Railway or Render |
| **Database** | Embedded Postgres (`pgserver`) | **Neon** or **Supabase** |

**Vercel does not host your database.** It only serves the Next.js dashboard. All event data lives in Postgres, accessed by the FastAPI backend.

---

## Local development (current default)

Local Postgres runs via **pgserver** — no Docker or Homebrew Postgres required.

| Item | Location |
|---|---|
| Data directory | `/tmp/retentioniq_pgdata` |
| Connection string | Written to `backend/.env` by `ensure_db.py` |
| CSV source | `backend/data/raw/product.csv` (1.2 GB, gitignored) |

### Start locally (recommended)

```bash
chmod +x scripts/start_local.sh
./scripts/start_local.sh
```

This script:
1. Kills duplicate servers (fixes CSS 404 issues from multiple `next dev` instances)
2. Starts embedded Postgres + API
3. Builds and runs the frontend in **production mode** (stable assets)

### Load data (one-time per database)

```bash
cd backend
source .venv/bin/activate
python scripts/load_kaggle_data.py \
  --csv-path data/raw/product.csv \
  --truncate \
  --refresh-aggregates
```

Takes ~15–25 minutes for 8.4M events. Refresh aggregates after any data change:

```bash
python scripts/refresh_aggregates.py
```

---

## Production: hosted Postgres (Neon recommended)

### Step 1 — Create a Neon database

1. Go to [neon.tech](https://neon.tech) and create a free project
2. Name it `retentioniq`
3. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/retentioniq?sslmode=require
   ```
4. Convert to SQLAlchemy format (add `+psycopg`):
   ```
   postgresql+psycopg://user:password@ep-xxx.region.aws.neon.tech/retentioniq?sslmode=require
   ```

**Alternative:** [Supabase](https://supabase.com) → Project Settings → Database → Connection string (same format).

### Step 2 — Run migrations against Neon

```bash
cd backend
source .venv/bin/activate

export DATABASE_URL="postgresql+psycopg://user:pass@host/retentioniq?sslmode=require"
alembic upgrade head
```

### Step 3 — Load Kaggle data into Neon

**Neon free tier is 512 MB.** The full 8.4M-event dataset will not fit. Use a demo subset:

```bash
export DATABASE_URL="postgresql+psycopg://..."
python scripts/load_kaggle_data.py \
  --csv-path data/raw/product.csv \
  --truncate \
  --max-chunks 2 \
  --refresh-aggregates
```

`--max-chunks 2` loads ~400k events (~80–120 MB) — enough for all dashboard views on the free plan.

If a previous full load failed with `DiskFull`, you **must** pass `--truncate` before reloading.

For local dev (unlimited disk), omit `--max-chunks`:

```bash
export DATABASE_URL="postgresql+psycopg://..."
python scripts/load_kaggle_data.py \
  --csv-path data/raw/product.csv \
  --truncate \
  --refresh-aggregates
```

### Step 4 — Deploy API (Railway)

1. Create a Railway project → Deploy from GitHub → select `backend/`
2. Set environment variables:
   ```
   DATABASE_URL=postgresql+psycopg://...
   CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000
   ```
3. Railway uses `backend/Dockerfile` automatically
4. Verify: `GET https://your-api.railway.app/health`

### Step 5 — Deploy frontend (Vercel)

1. Import repo → set root directory to `frontend`
2. Environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```
3. Deploy

### Step 6 — Verify production

```bash
curl https://your-api.railway.app/health
# → {"status":"ok","database":"connected"}

curl https://your-api.railway.app/api/overview
# → real KPI JSON in < 500ms
```

---

## Environment files

### `backend/.env` (local)

```env
DATABASE_URL=postgresql+psycopg://postgres:@/postgres?host=/private/tmp/retentioniq_pgdata
CORS_ORIGINS=http://localhost:3000
```

### `backend/.env` (production)

```env
DATABASE_URL=postgresql+psycopg://user:pass@ep-xxx.neon.tech/retentioniq?sslmode=require
CORS_ORIGINS=https://retentioniq.vercel.app,http://localhost:3000
```

### `frontend/.env.local` (local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### `frontend/.env.local` (production — set in Vercel dashboard)

```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app
```

---

## What lives where

| Data | Stored in |
|---|---|
| 8.4M events | Postgres `events` table |
| User signup dates, channels | Postgres `users` table |
| Pre-computed KPIs | Postgres materialized views (`mv_*`) |
| Meta badge counts | Postgres `dashboard_stats` cache table |
| Dashboard UI code | Vercel (static/SSR) |
| API code | Railway/Render |
| Kaggle CSV | Your machine only (for initial load) |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Dashboard unstyled (plain HTML) | Multiple dev servers running. Run `./scripts/start_local.sh` |
| All KPIs show 0% | Database empty or load in progress. Check `/api/meta` event_count |
| "Failed to fetch" | API not running. Start backend on port 8000 |
| Slow overview (>500ms) | Run `python scripts/refresh_aggregates.py` |
| "Request failed (500)" on live site | Vercel backend cannot reach Neon. Check `/health` → `database: connected`. Set `DATABASE_URL` in Vercel env (Neon integration). Redeploy after git pull. Reload Neon with `--truncate --max-chunks 2` if a prior load hit `DiskFull`. |
| Neon `DiskFull: 512 MB limit` | Use `--max-chunks 2` (or 1) instead of full dataset |
