#!/usr/bin/env bash
# Run on the production server after rsync (from ~/call-analysis).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
AI_URL="http://ai_service:9000/analyze-call"
AI_HEALTH_PORT="${AI_SERVICE_HEALTH_PORT:-44781}"
LOG_DIR="${ROOT}/logs"
mkdir -p "$LOG_DIR"

echo "→ Starting Docker services (web, frontend, celery, beat, redis)…"
"${COMPOSE[@]}" up -d --build web frontend celery_worker celery_beat redis

echo "→ Building & starting AI service…"
"${COMPOSE[@]}" up -d --build ai_service

echo "→ Running migrations…"
"${COMPOSE[@]}" exec -T web python manage.py migrate --noinput --skip-checks

echo "→ Ensuring AI_SERVICE_URL in .env…"
if [[ -f .env ]]; then
  if grep -q '^AI_SERVICE_URL=' .env; then
    sed -i "s|^AI_SERVICE_URL=.*|AI_SERVICE_URL=${AI_URL}|" .env
  else
    echo "AI_SERVICE_URL=${AI_URL}" >> .env
  fi
  echo "→ Restarting web + celery to pick up .env…"
  "${COMPOSE[@]}" up -d web celery_worker celery_beat
else
  echo "WARNING: .env not found — set AI_SERVICE_URL=${AI_URL} manually"
fi

echo "→ Checking AI service (port ${AI_HEALTH_PORT})…"
sleep 3
if curl -sf "http://127.0.0.1:${AI_HEALTH_PORT}/" >/dev/null 2>&1; then
  echo "   AI service OK at ${AI_URL}"
else
  echo "WARNING: AI service not responding on port ${AI_HEALTH_PORT}"
fi

echo "→ Re-queuing pending/failed calls…"
"${COMPOSE[@]}" exec -T web python manage.py shell -c "
from calls.models import Call
from calls.tasks import analyze_call
pending = Call.objects.filter(status__in=['pending', 'failed'])
print(f'Pending/failed calls: {pending.count()}')
for call in pending:
    analyze_call.delay(call.id)
    print(f'  queued call #{call.id}')
"

echo "→ Service status:"
"${COMPOSE[@]}" ps
echo "Deploy complete."
