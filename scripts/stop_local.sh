#!/usr/bin/env bash
# Stop detached RetentionIQ local servers.
set -euo pipefail
LOG_DIR="${TMPDIR:-/tmp}"
lsof -ti:3000,8000 2>/dev/null | xargs kill -9 2>/dev/null || true
rm -f "$LOG_DIR/retentioniq_api.pid" "$LOG_DIR/retentioniq_fe.pid"
echo "Stopped servers on :3000 and :8000"
