#!/usr/bin/env bash
# Sync ai_service + backend + frontend to production (source only — no large binaries).
#
# Usage:
#   ./rsync-data.sh
#   CALL_RSYNC_REMOTE=user@host:~/call-analysis/ ./rsync-data.sh
#   ./rsync-data.sh administrator@63.141.255.154:~/call-analysis/
#   ./rsync-data.sh --dry-run
#   ./rsync-data.sh --no-deploy   # sync only, skip restart
#
# Deploy restarts web, frontend, celery, redis, and ai_service via scripts/remote-deploy.sh.
#
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
REMOTE="${CALL_RSYNC_REMOTE:-administrator@63.141.255.154:~/call-analysis/}"
DRY_RUN=0
DEPLOY=1

usage() {
  sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage 0 ;;
    -n|--dry-run) DRY_RUN=1; shift ;;
    --no-deploy) DEPLOY=0; shift ;;
    -*) echo "Unknown option: $1" >&2; usage 1 ;;
    *) REMOTE="$1"; shift ;;
  esac
done

if [[ -n "${CALL_RSYNC_NO_DEPLOY:-}" ]]; then
  DEPLOY=0
fi

REMOTE="${REMOTE%/}/"
REMOTE_HOST="${REMOTE%%:*}"
REMOTE_DIR="${REMOTE#*:}"
REMOTE_DIR="${REMOTE_DIR%/}"

SSH_SOCKET_DIR="${TMPDIR:-/tmp}/call-analysis-rsync-$$"
mkdir -p "$SSH_SOCKET_DIR"
SSH_SOCKET="$SSH_SOCKET_DIR/control"
RSYNC_SSH="ssh -o ControlMaster=auto -o ControlPath=${SSH_SOCKET} -o ControlPersist=120"

cleanup() {
  ssh -O exit -o ControlPath="$SSH_SOCKET" "$REMOTE_HOST" 2>/dev/null || true
  rm -rf "$SSH_SOCKET_DIR"
}
trap cleanup EXIT

RSYNC=(rsync -avz --human-readable --progress -e "$RSYNC_SSH")
if [[ "$DRY_RUN" -eq 1 ]]; then
  RSYNC+=(--dry-run)
fi

ssh -o ControlMaster=yes -o ControlPath="$SSH_SOCKET" -o ControlPersist=120 \
  "$REMOTE_HOST" true

ssh -o ControlPath="$SSH_SOCKET" "$REMOTE_HOST" "mkdir -p ${REMOTE_DIR}"

COMMON_EXCLUDES=(
  --exclude '.git/'
  --exclude '.idea/'
  --exclude '.vscode/'
  --exclude '.cursor/'
  --exclude '.DS_Store'
  --exclude 'Thumbs.db'
  --exclude '*.swp'
  --exclude '*~'
  --exclude '.env'
  --exclude '.env.*'
  --exclude '*.pem'
  --exclude '*.key'
  --exclude '*.mp3'
  --exclude '*.wav'
  --exclude '*.m4a'
  --exclude '*.aac'
  --exclude '*.ogg'
  --exclude '*.flac'
  --exclude '*.bin'
  --exclude '*.pt'
  --exclude '*.ckpt'
)

BACKEND_EXCLUDES=(
  "${COMMON_EXCLUDES[@]}"
  --exclude '__pycache__/'
  --exclude '*.py[cod]'
  --exclude '*.egg-info/'
  --exclude '.venv/'
  --exclude 'venv/'
  --exclude 'env/'
  --exclude 'whisper_env/'
  --exclude '.mypy_cache/'
  --exclude '.ruff_cache/'
  --exclude '.pytest_cache/'
  --exclude 'htmlcov/'
  --exclude '.coverage'
  --exclude '*.log'
  --exclude 'db.sqlite3'
  --exclude 'db.sqlite3-*'
  --exclude 'media/'
  --exclude 'staticfiles/'
  --exclude 'static/'
  --exclude 'celerybeat-schedule'
  --exclude 'celerybeat.pid'
)

FRONTEND_EXCLUDES=(
  "${COMMON_EXCLUDES[@]}"
  --exclude 'node_modules/'
  --exclude 'dist/'
  --exclude 'build/'
  --exclude 'coverage/'
  --exclude '.vercel/'
  --exclude 'npm-debug.log*'
  --exclude 'yarn-debug.log*'
  --exclude 'yarn-error.log*'
  --exclude '.pnpm-debug.log*'
  --exclude '*.tsbuildinfo'
)

AI_SERVICE_EXCLUDES=(
  "${COMMON_EXCLUDES[@]}"
  --exclude '__pycache__/'
  --exclude '*.py[cod]'
  --exclude '*.egg-info/'
  --exclude '.venv/'
  --exclude 'venv/'
  --exclude 'env/'
  --exclude 'whisper_env/'
  --exclude 'outputs/'
  --exclude '*.log'
  --exclude '*.json'
  --exclude '*.db'
  --exclude '*.sqlite'
  --exclude '*.tmp'
  --exclude '*.bak'
  --exclude '*.backup'
)

echo "→ Remote:     $REMOTE"
echo "→ Root:       scripts/, docker-compose*.yml"
echo "→ ai_service: $ROOT/ai_service/"
echo "→ Backend:    $ROOT/backend/"
echo "→ Frontend:   $ROOT/frontend/"
[[ "$DRY_RUN" -eq 1 ]] && echo "(dry run — no files changed)"
echo

ssh -o ControlPath="$SSH_SOCKET" "$REMOTE_HOST" "mkdir -p ${REMOTE_DIR}/scripts"

"${RSYNC[@]}" "${COMMON_EXCLUDES[@]}" \
  "$ROOT/scripts/" "$REMOTE/scripts/"

"${RSYNC[@]}" "${COMMON_EXCLUDES[@]}" \
  "$ROOT/docker-compose.yml" \
  "$ROOT/docker-compose.prod.yml" \
  "$REMOTE/"

"${RSYNC[@]}" "${AI_SERVICE_EXCLUDES[@]}" \
  "$ROOT/ai_service/" "$REMOTE/ai_service/"

"${RSYNC[@]}" "${BACKEND_EXCLUDES[@]}" \
  "$ROOT/backend/" "$REMOTE/backend/"

"${RSYNC[@]}" "${FRONTEND_EXCLUDES[@]}" \
  "$ROOT/frontend/" "$REMOTE/frontend/"

echo
echo "Sync done."

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "(dry run — deploy skipped)"
  exit 0
fi

if [[ "$DEPLOY" -eq 1 ]]; then
  echo "→ Deploying on server: $REMOTE_DIR (web, frontend, celery, redis, ai_service)"
  ssh -o ControlPath="$SSH_SOCKET" "$REMOTE_HOST" bash -s <<EOF
set -euo pipefail
cd ${REMOTE_DIR}
chmod +x scripts/remote-deploy.sh
./scripts/remote-deploy.sh
EOF
  echo "Deploy done."
else
  echo "Deploy skipped (--no-deploy)."
fi
