#!/usr/bin/env bash
# Expose the Django backend (docker port 8001) via ngrok for external testers.
#
# Prerequisites:
#   - ngrok installed and authenticated (https://ngrok.com/download)
#   - Backend running: docker compose up -d web
#
# Usage:
#   ./scripts/start-ngrok.sh
#   ./scripts/start-ngrok.sh --detach
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env"
URL_FILE="${ROOT}/.ngrok-url"
BACKEND_PORT="${BACKEND_PORT:-8001}"
DETACH=false

for arg in "$@"; do
  case "$arg" in
    --detach|-d) DETACH=true ;;
    --help|-h)
      echo "Usage: $0 [--detach]"
      exit 0
      ;;
  esac
done

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ERROR: ngrok is not installed."
  echo "Install: https://ngrok.com/download"
  echo "Then run: ngrok config add-authtoken <YOUR_TOKEN>"
  exit 1
fi

if ! curl -sf -o /dev/null "http://127.0.0.1:${BACKEND_PORT}/admin/"; then
  echo "ERROR: Backend is not reachable at http://127.0.0.1:${BACKEND_PORT}"
  echo "Start it first: cd \"${ROOT}\" && docker compose up -d web"
  exit 1
fi

echo "Starting ngrok tunnel -> localhost:${BACKEND_PORT} ..."

if [[ "$DETACH" == true ]]; then
  mkdir -p "${ROOT}/logs"
  nohup ngrok http "${BACKEND_PORT}" --log=stdout > "${ROOT}/logs/ngrok.log" 2>&1 &
  echo $! > "${ROOT}/.ngrok.pid"
  sleep 3
else
  ngrok http "${BACKEND_PORT}" --log=stdout &
  NGROK_PID=$!
  trap 'kill "$NGROK_PID" 2>/dev/null || true' EXIT INT TERM
  sleep 3
fi

fetch_ngrok_url() {
  python3 - <<'PY'
import json
import urllib.request

try:
    with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels", timeout=5) as resp:
        data = json.load(resp)
except Exception:
    print("")
    raise SystemExit(0)

for tunnel in data.get("tunnels", []):
    if tunnel.get("proto") == "https":
        print(tunnel.get("public_url", ""))
        break
PY
}

PUBLIC_URL=""
for _ in 1 2 3 4 5; do
  PUBLIC_URL="$(fetch_ngrok_url)"
  if [[ -n "$PUBLIC_URL" ]]; then
    break
  fi
  sleep 1
done

if [[ -z "$PUBLIC_URL" ]]; then
  echo "ERROR: Could not read ngrok public URL from http://127.0.0.1:4040/api/tunnels"
  exit 1
fi

PUBLIC_URL="$(echo "$PUBLIC_URL" | sed 's|/*$||')"
NGROK_HOST="$(echo "$PUBLIC_URL" | sed -E 's|https?://||' | cut -d/ -f1)"
echo "$PUBLIC_URL" > "$URL_FILE"

ensure_env_file() {
  if [[ ! -f "$ENV_FILE" ]]; then
    cp "${ROOT}/.env.example" "$ENV_FILE" 2>/dev/null || touch "$ENV_FILE"
  fi
}

set_env_value() {
  local key="$1"
  local value="$2"
  ensure_env_file

  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

upsert_csv_value() {
  local key="$1"
  local value="$2"
  local strip_pattern="${3:-}"
  local current=""
  local merged=""

  ensure_env_file

  if grep -q "^${key}=" "$ENV_FILE"; then
    current="$(grep "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2-)"
  fi

  if [[ -n "$strip_pattern" && -n "$current" ]]; then
    current="$(echo "$current" | tr ',' '\n' | grep -Ev "$strip_pattern" | paste -sd, - || true)"
  fi

  if [[ -z "$current" ]]; then
    merged="$value"
  elif echo ",${current}," | grep -q ",${value},"; then
    merged="$current"
  else
    merged="${current},${value}"
  fi

  set_env_value "$key" "$merged"
}

# Mobile builds use NGROK_PUBLIC_URL / API_BASE_URL.
# Keep the local web UI on localhost:8001 so `docker compose up -d` still
# shows data even while ngrok is running for the Flutter app.
set_env_value "NGROK_PUBLIC_URL" "$PUBLIC_URL"
set_env_value "API_BASE_URL" "$PUBLIC_URL"
set_env_value "VITE_API_BASE_URL" "http://localhost:8001"
set_env_value "VITE_WS_BASE_URL" "ws://localhost:8001"
upsert_csv_value "ALLOWED_HOSTS" "$NGROK_HOST" 'ngrok'
upsert_csv_value "CORS_ALLOWED_ORIGINS" "$PUBLIC_URL" 'ngrok'

echo ""
echo "============================================"
echo " Ngrok tunnel is live"
echo " Public URL : ${PUBLIC_URL}"
echo " Saved to   : ${URL_FILE}"
echo " Updated    : ${ENV_FILE}"
echo "   NGROK_PUBLIC_URL=${PUBLIC_URL}"
echo "   API_BASE_URL=${PUBLIC_URL}"
echo "   VITE_API_BASE_URL=http://localhost:8001  (local web UI)"
echo "   VITE_WS_BASE_URL=ws://localhost:8001"
echo "============================================"
echo ""
echo "Restart the backend so it allows the ngrok host:"
echo "  cd \"${ROOT}\" && docker compose up -d web"
echo ""
echo "Build the mobile app with ngrok:"
echo "  ./scripts/build-flutter-app.sh"
echo ""

if [[ "$DETACH" == true ]]; then
  echo "Running in background. Logs: ${ROOT}/logs/ngrok.log"
  echo "Stop with: kill \$(cat ${ROOT}/.ngrok.pid)"
else
  echo "Press Ctrl+C to stop ngrok."
  wait "${NGROK_PID:-$!}"
fi
