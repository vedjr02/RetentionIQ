#!/usr/bin/env bash
# Smoke-test RetentionIQ API endpoints (local or production).
set -euo pipefail

API_BASE="${1:-http://localhost:8000}"

echo "==> Health"
curl -sf "${API_BASE}/health" | python3 -m json.tool

echo ""
echo "==> Meta"
curl -sf "${API_BASE}/api/meta" | python3 -m json.tool

echo ""
echo "==> Overview KPIs (+ response time)"
curl -sf -D - "${API_BASE}/api/overview" -o /tmp/retentioniq_overview.json 2>/dev/null | grep -i "x-response-time"
python3 -c "
import json
with open('/tmp/retentioniq_overview.json') as f:
    data = json.load(f)
print('activation_rate:', data['kpis']['activation_rate'])
print('funnel_stages:', len(data['funnel_stages']))
print('channels:', len(data['channels']))
"

echo ""
echo "All checks passed."
