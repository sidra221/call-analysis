#!/usr/bin/env bash
# Interactive Flutter build for the mobile app.
# Prompts for API target (ngrok vs localhost) before building.
#
# Usage:
#   ./scripts/build-flutter-app.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOBILE_DIR="${ROOT}/mobile"
ENV_FILE="${ROOT}/.env"
URL_FILE="${ROOT}/.ngrok-url"

detect_lan_ip() {
  ip -4 addr show scope global 2>/dev/null | awk '/inet / {print $2}' | cut -d/ -f1 | while read -r candidate; do
    case "$candidate" in
      127.*|10.2.0.*|172.1[6-9].*|172.2[0-9].*|172.3[0-1].*) continue ;;
      10.*|192.168.*)
        echo "$candidate"
        return 0
        ;;
    esac
  done
}

is_ipv4() {
  local ip="$1"
  [[ "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]] || return 1
  local IFS=.
  local -a parts=($ip)
  local part
  for part in "${parts[@]}"; do
    if ((10#$part > 255)); then
      return 1
    fi
  done
  return 0
}

DEFAULT_LAN_HOST="${API_HOST:-$(detect_lan_ip)}"
DEFAULT_LAN_HOST="${DEFAULT_LAN_HOST:-10.37.235.187}"

read_env_value() {
  local key="$1"
  if [[ -f "$ENV_FILE" ]] && grep -q "^${key}=" "$ENV_FILE"; then
    grep "^${key}=" "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '[:space:]'
  fi
}

if ! command -v flutter >/dev/null 2>&1; then
  echo "ERROR: flutter is not installed or not on PATH."
  exit 1
fi

echo ""
echo "=========================================="
echo " Vocalys — Flutter App Build"
echo "=========================================="
echo ""
echo "Which API should this build use?"
echo "  1) localhost / LAN  (local dev, same Wi‑Fi)"
echo "  2) ngrok            (share with external users)"
echo ""
read -r -p "Enter choice [1/2] (default: 1): " API_CHOICE
API_CHOICE="${API_CHOICE:-1}"

DART_DEFINES=()

case "$API_CHOICE" in
  2|ngrok|Ngrok|NGROK)
    API_MODE="ngrok"
    PUBLIC_URL="$(read_env_value API_BASE_URL)"
    PUBLIC_URL="${PUBLIC_URL:-$(read_env_value NGROK_PUBLIC_URL)}"

    if [[ -f "$URL_FILE" ]]; then
      SAVED_URL="$(tr -d '[:space:]' < "$URL_FILE")"
      if [[ -n "$SAVED_URL" ]]; then
        if [[ -z "$PUBLIC_URL" ]]; then
          PUBLIC_URL="$SAVED_URL"
        fi
        read -r -p "Use ngrok URL (${PUBLIC_URL:-$SAVED_URL})? [Y/n]: " USE_SAVED
        USE_SAVED="${USE_SAVED:-Y}"
        if [[ "$USE_SAVED" =~ ^[Yy]$ ]]; then
          PUBLIC_URL="${PUBLIC_URL:-$SAVED_URL}"
        else
          PUBLIC_URL=""
        fi
      fi
    fi

    if [[ -z "$PUBLIC_URL" ]]; then
      echo ""
      echo "Start ngrok first if needed:"
      echo "  ./scripts/start-ngrok.sh"
      echo ""
      read -r -p "Enter ngrok HTTPS URL (e.g. https://abc.ngrok-free.app): " PUBLIC_URL
    fi

    PUBLIC_URL="$(echo "$PUBLIC_URL" | sed 's|/*$||')"
    if [[ -z "$PUBLIC_URL" ]]; then
      echo "ERROR: ngrok URL is required."
      exit 1
    fi

    DART_DEFINES+=( "--dart-define=API_BASE_URL=${PUBLIC_URL}" )
    echo ""
    echo "API mode : ngrok"
    echo "API URL  : ${PUBLIC_URL}"
    ;;
  1|localhost|local)
    API_MODE="localhost"
    while true; do
      read -r -p "LAN IP for Android devices [${DEFAULT_LAN_HOST}]: " LAN_HOST
      LAN_HOST="${LAN_HOST:-$DEFAULT_LAN_HOST}"
      if [[ "$LAN_HOST" == "1" || "$LAN_HOST" == "2" ]]; then
        echo "That's a menu number, not an IP. Press Enter to use ${DEFAULT_LAN_HOST}, or type your Wi-Fi IP (e.g. 192.168.1.10)."
        continue
      fi
      if ! is_ipv4 "$LAN_HOST"; then
        echo "Invalid IPv4 address: ${LAN_HOST}"
        continue
      fi
      break
    done
    DART_DEFINES+=( "--dart-define=API_HOST=${LAN_HOST}" )
    echo ""
    echo "API mode : localhost / LAN"
    echo "API host : ${LAN_HOST}:8001 (Android)"
    echo "           localhost:8001 (Web / iOS simulator)"
    ;;
  *)
    echo "ERROR: Enter 1 for LAN or 2 for ngrok."
    exit 1
    ;;
esac

echo ""
echo "Select build target:"
echo "  1) Android APK        (release, easy to share)"
echo "  2) Android App Bundle (release, Play Store)"
echo "  3) Web                (release)"
echo "  4) Android APK        (debug, quick test)"
echo ""
read -r -p "Enter choice [1-4] (default: 1): " BUILD_CHOICE
BUILD_CHOICE="${BUILD_CHOICE:-1}"

cd "$MOBILE_DIR"

echo ""
echo "Running flutter pub get ..."
flutter pub get

BUILD_CMD=()
OUTPUT_HINT=""

case "$BUILD_CHOICE" in
  1|apk|APK)
    BUILD_CMD=(flutter build apk --release "${DART_DEFINES[@]}")
    OUTPUT_HINT="${MOBILE_DIR}/build/app/outputs/flutter-apk/app-release.apk"
    ;;
  2|aab|bundle|AAB)
    BUILD_CMD=(flutter build appbundle --release "${DART_DEFINES[@]}")
    OUTPUT_HINT="${MOBILE_DIR}/build/app/outputs/bundle/release/app-release.aab"
    ;;
  3|web|Web|WEB)
    BUILD_CMD=(flutter build web --release "${DART_DEFINES[@]}")
    OUTPUT_HINT="${MOBILE_DIR}/build/web/"
    ;;
  4|debug)
    BUILD_CMD=(flutter build apk --debug "${DART_DEFINES[@]}")
    OUTPUT_HINT="${MOBILE_DIR}/build/app/outputs/flutter-apk/app-debug.apk"
    ;;
  *)
    echo "ERROR: Invalid build choice."
    exit 1
    ;;
esac

echo ""
echo "Building with: ${BUILD_CMD[*]}"
echo ""

"${BUILD_CMD[@]}"

echo ""
echo "============================================"
echo " Build complete"
echo " API mode : ${API_MODE}"
echo " Output   : ${OUTPUT_HINT}"
echo "============================================"
echo ""

if [[ "$API_MODE" == "ngrok" ]]; then
  echo "Reminder: keep ngrok and docker backend running while testers use the app."
  echo "  ./scripts/start-ngrok.sh --detach"
  echo "  docker compose up -d web"
fi
