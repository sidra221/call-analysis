#!/usr/bin/env bash
# Start Call Analysis — Docker stack + AI service (GPU).
#
# Usage:
#   ./karabala.sh
#   ./karabala.sh --logs-ai    # follow AI service log
#   ./karabala.sh --stop-ai    # stop background AI service only
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${ROOT}/.env"
VENV="${ROOT}/ai_service/whisper_env"
AI_DIR="${ROOT}/ai_service"
PID_FILE="${AI_DIR}/.ai-service.pid"
LOG_FILE="${AI_DIR}/ai-service.log"
AI_PORT="${AI_PORT:-9001}"

red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

stop_ai() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(cat "$PID_FILE")"
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      green "Stopped AI service (PID $pid)."
    fi
    rm -f "$PID_FILE"
  fi
  if pgrep -f "${VENV}/bin/uvicorn app.main:app" >/dev/null 2>&1; then
    pkill -f "${VENV}/bin/uvicorn app.main:app" || true
    green "Stopped stray uvicorn process."
  fi
}

ai_running() {
  curl -sf "http://127.0.0.1:${AI_PORT}/" >/dev/null 2>&1
}

case "${1:-}" in
  --stop-ai)
    stop_ai
    exit 0
    ;;
  --logs-ai)
    tail -f "$LOG_FILE"
    exit 0
    ;;
  --help|-h)
    sed -n '2,8p' "$0" | sed 's/^# \?//'
    exit 0
    ;;
esac

bold "Call Analysis — startup"
echo "Project: ${ROOT}"
echo

if ! command -v docker >/dev/null 2>&1; then
  red "ERROR: docker is not installed."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  red "ERROR: Docker daemon is not running."
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "${ROOT}/.env.example" ]]; then
    cp "${ROOT}/.env.example" "$ENV_FILE"
    green "Created .env from .env.example — review before production use."
  else
    red "ERROR: missing .env"
    exit 1
  fi
fi

# Parse AI port from .env when set (…:PORT/analyze-call).
if grep -q '^AI_SERVICE_URL=' "$ENV_FILE"; then
  url="$(grep '^AI_SERVICE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r' | tr -d '"')"
  if [[ "$url" =~ :([0-9]+)/ ]]; then
    AI_PORT="${BASH_REMATCH[1]}"
  fi
fi

bold "[1/3] Docker Compose"
cd "$ROOT"
docker compose up -d

bold "[2/3] Waiting for backend"
for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:8001/docs/" >/dev/null 2>&1; then
    green "Backend is up."
    break
  fi
  sleep 2
done
if ! curl -sf "http://127.0.0.1:8001/docs/" >/dev/null 2>&1; then
  red "WARNING: Backend did not become healthy in time. Check: docker compose logs web"
fi

bold "[3/3] AI service (host, port ${AI_PORT})"
if [[ ! -x "${VENV}/bin/uvicorn" ]]; then
  red "ERROR: AI venv not found at ${VENV}"
  echo "Create it:"
  echo "  python3 -m venv ai_service/whisper_env"
  echo "  ai_service/whisper_env/bin/pip install -r ai_service/requirements.txt"
  echo "  # + PyTorch CUDA — see README / project notes"
  exit 1
fi

if ai_running; then
  green "AI service already running on port ${AI_PORT}."
else
  stop_ai
  mkdir -p "$AI_DIR"
  # shellcheck disable=SC2046
  export $(grep -E '^(AI_SERVICE_API_KEY|HUGGINGFACE_TOKEN|OPENAI_API_KEY|ENABLE_LLM_REFINEMENT|LLM_MODEL|LLM_REFINEMENT_MODE|AI_DEVICE)=' "$ENV_FILE" | sed 's/\r$//' | xargs)
  cd "$AI_DIR"
  nohup "${VENV}/bin/uvicorn" app.main:app --host 0.0.0.0 --port "$AI_PORT" >>"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  cd "$ROOT"

  bold "Loading AI models (may take ~30s on first run)…"
  for _ in $(seq 1 90); do
    if ai_running; then
      green "AI service is up (PID $(cat "$PID_FILE"))."
      break
    fi
    sleep 2
  done
  if ! ai_running; then
    red "ERROR: AI service failed to start. Log: ${LOG_FILE}"
    tail -20 "$LOG_FILE" || true
    exit 1
  fi
fi

echo
bold "Ready"
echo "  Frontend   http://localhost:3001"
echo "  API        http://localhost:8001/docs/"
echo "  AI service http://127.0.0.1:${AI_PORT}/"
echo "  pgAdmin    http://localhost:5050"
echo
echo "  AI logs    ./karabala.sh --logs-ai"
echo "  Stop AI    ./karabala.sh --stop-ai"
echo "  Stop all   docker compose down"
