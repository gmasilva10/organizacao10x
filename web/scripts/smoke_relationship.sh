#!/usr/bin/env bash
set -euo pipefail

# Simple smoke for Relationship module in staging
# Requirements: curl
# Optional: jq (for nicer output)

# Usage:
#   BASE_URL="https://staging.example.com" \
#   TENANT_ID="00000000-0000-0000-0000-000000000000" \
#   CRON_SECRET="your-cron-secret" \
#   STUDENT_ID="uuid-of-sample-student" \
#   OCCURRENCE_ID="1" \
#   bash web/scripts/smoke_relationship.sh

BASE_URL=${BASE_URL:-"http://localhost:3000"}
TENANT_ID=${TENANT_ID:-""}
CRON_SECRET=${CRON_SECRET:-""}
STUDENT_ID=${STUDENT_ID:-""}
OCCURRENCE_ID=${OCCURRENCE_ID:-""}

if [[ -z "$TENANT_ID" ]]; then echo "TENANT_ID required"; exit 1; fi

echo "== GET templates (should read v2 with REL_TEMPLATES_V2_READ=1) =="
curl -sS "$BASE_URL/api/relationship/templates" | (jq . 2>/dev/null || cat)

echo "\n== POST template (dual-write: MVP+v2) =="
curl -sS -X POST "$BASE_URL/api/relationship/templates" \
  -H 'Content-Type: application/json' \
  --data '{
    "code":"SMOKE_MSG",
    "title":"Smoke Template",
    "anchor":"sale_close",
    "touchpoint":"Smoke Touchpoint",
    "suggested_offset":"+0d",
    "channel_default":"whatsapp",
    "message_v1":"Olá [Nome] — smoke test",
    "active":true,
    "priority":0,
    "audience_filter":{},
    "variables":["Nome","PrimeiroNome"]
  }' | (jq . 2>/dev/null || cat)

echo "\n== POST job (Bearer CRON_SECRET) =="
curl -sS -w "\nHTTP %{http_code}\n" -X POST "$BASE_URL/api/relationship/job" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H 'Content-Type: application/json' \
  --data "{\"tenant_id\":\"$TENANT_ID\"}"

echo "\n== GET tasks (Kanban) =="
curl -sS -D - "$BASE_URL/api/relationship/tasks?page=1&page_size=10" -o /tmp/tasks.json
echo "Headers above include X-Query-Time. First items:"
cat /tmp/tasks.json | (jq '.items[:3]' 2>/dev/null || head -c 1000 /tmp/tasks.json)

TASK_ID=$(cat /tmp/tasks.json | jq -r '.items[0].id' 2>/dev/null || true)
if [[ -n "$TASK_ID" && "$TASK_ID" != "null" ]]; then
  echo "\n== PATCH task -> sent (id: $TASK_ID) =="
  curl -sS -w "\nHTTP %{http_code}\n" -X PATCH "$BASE_URL/api/relationship/tasks" \
    -H 'Content-Type: application/json' \
    --data "{\"task_id\":\"$TASK_ID\",\"status\":\"sent\"}"
fi

if [[ -n "$STUDENT_ID" && -n "$OCCURRENCE_ID" ]]; then
  echo "\n== POST occurrence-trigger (scheduled) =="
  WHEN=$(date -u +"%Y-%m-%dT03:00:00Z")
  curl -sS -w "\nHTTP %{http_code}\n" -X POST "$BASE_URL/api/relationship/occurrence-trigger" \
    -H 'Content-Type: application/json' \
    --data "{\"student_id\":\"$STUDENT_ID\",\"occurrence_id\":$OCCURRENCE_ID,\"reminder_at\":\"$WHEN\",\"occurrence_type\":\"SMOKE\",\"occurrence_notes\":\"Smoke test\",\"tenant_id\":\"$TENANT_ID\"}"
fi

if [[ -n "$STUDENT_ID" ]]; then
  echo "\n== GET timeline logs of student =="
  curl -sS "$BASE_URL/api/students/$STUDENT_ID/relationship-logs?page=1&page_size=10" | (jq . 2>/dev/null || cat)
fi

echo "\nSmoke completed. Check X-Query-Time headers and job stats.duration_ms for P95 tracking."

