#!/usr/bin/env bash
# Start RetentionIQ locally — detached (survives terminal close).
# Uses production Next.js build for stable CSS/asset serving.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${TMPDIR:-/tmp}"
API_LOG="$LOG_DIR/retentioniq_api.log"
FE_LOG="$LOG_DIR/retentioniq_fe.log"

echo "Stopping any existing servers on :3000 and :8000..."
lsof -ti:3000,8000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

echo "Starting Postgres (embedded via pgserver)..."
cd "$ROOT/backend"
source .venv/bin/activate
python scripts/ensure_db.py

echo "Starting API on http://127.0.0.1:8000 ..."
nohup uvicorn app.main:app --host 127.0.0.1 --port 8000 >"$API_LOG" 2>&1 &
echo $! > "$LOG_DIR/retentioniq_api.pid"

echo "Building frontend (production)..."
cd "$ROOT/frontend"
npm run build --silent

echo "Starting frontend on http://127.0.0.1:3000 ..."
nohup npm run start -- --port 3000 --hostname 127.0.0.1 >"$FE_LOG" 2>&1 &
echo $! > "$LOG_DIR/retentioniq_fe.pid"

sleep 3

if curl -sf --max-time 5 http://127.0.0.1:8000/health >/dev/null && curl -sf --max-time 5 http://127.0.0.1:3000/ >/dev/null; then
  echo ""
  echo "RetentionIQ is running:"
  echo "  Dashboard  → http://127.0.0.1:3000"
  echo "  API docs   → http://127.0.0.1:8000/docs"
  echo "  Logs       → $API_LOG, $FE_LOG"
else
  echo "Startup failed. Check logs:"
  echo "  tail -20 $API_LOG"
  echo "  tail -20 $FE_LOG"
  exit 1
fi
