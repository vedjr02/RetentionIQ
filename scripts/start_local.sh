#!/usr/bin/env bash
# Start RetentionIQ locally with a single frontend + API instance.
# Uses production Next.js build for stable CSS/asset serving (avoids dev-server 404s).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Stopping any existing servers on :3000 and :8000..."
lsof -ti:3000,8000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

echo "Starting Postgres (embedded via pgserver)..."
cd "$ROOT/backend"
source .venv/bin/activate
python scripts/ensure_db.py

echo "Starting API on http://localhost:8000 ..."
uvicorn app.main:app --reload --port 8000 &
API_PID=$!

echo "Building frontend (production)..."
cd "$ROOT/frontend"
npm run build --silent

echo "Starting frontend on http://localhost:3000 ..."
npm run start -- --port 3000 &
FE_PID=$!

trap 'kill $API_PID $FE_PID 2>/dev/null' EXIT

echo ""
echo "RetentionIQ is running:"
echo "  Dashboard  → http://localhost:3000"
echo "  API docs   → http://localhost:8000/docs"
echo "  Health     → http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
