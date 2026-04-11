#!/bin/bash
# ============================================================================
# Vampires MC — Dreamhost deploy (shared logic)
#
# Don't run this directly — use stage.sh or prod.sh, which set DEPLOY_ENV
# and exec this script.
#
# Flags:
#   --dry-run, -n   Show what rsync would transfer without uploading.
#   --force,   -f   Bypass prod safety gates (dirty tree, non-main branch).
#                   Does NOT bypass the confirmation prompt.
#   --help,    -h   Show usage.
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# shellcheck source=deploy-utils.sh
source "$SCRIPT_DIR/deploy-utils.sh"

# ---- Parse flags ---------------------------------------------------------
DRY_RUN=""
FORCE=""
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n) DRY_RUN=1 ;;
    --force|-f)   FORCE=1 ;;
    --help|-h)
      cat <<EOF
Usage: $(basename "$0") [--dry-run] [--force]

Deploys the site to the selected environment on Dreamhost via rsync over SSH.

  --dry-run, -n   Show what would be transferred without uploading.
  --force,   -f   Bypass prod safety gates (dirty tree / non-main branch).

Called via:
  utils/deploy/stage.sh   # deploys to stage.vampiresmc.com
  utils/deploy/prod.sh    # deploys to vampiresmc.com
EOF
      exit 0
      ;;
    *)
      err "Unknown flag: $arg"
      exit 1
      ;;
  esac
done

# ---- Env sanity ----------------------------------------------------------
if [ -z "${DEPLOY_ENV:-}" ]; then
  err "DEPLOY_ENV is not set. Run stage.sh or prod.sh, not deploy.sh directly."
  exit 1
fi
if [ "$DEPLOY_ENV" != "stage" ] && [ "$DEPLOY_ENV" != "prod" ]; then
  err "Invalid DEPLOY_ENV '$DEPLOY_ENV' — must be 'stage' or 'prod'."
  exit 1
fi

# ---- Required commands ---------------------------------------------------
require_cmd rsync "Install with 'brew install rsync'."
require_cmd ssh   "OpenSSH client is required."
require_cmd jq    "Install with 'brew install jq'."
require_cmd git   "Git is required."
require_cmd npx   "Install Node.js (with npm) so 'npx sass' is available."

cd "$PROJECT_ROOT"

DEPLOY_START=$(date +%s)

# ---- Read target from .vscode/sftp.json ----------------------------------
SFTP_JSON="$PROJECT_ROOT/.vscode/sftp.json"
if [ ! -f "$SFTP_JSON" ]; then
  err "Missing $SFTP_JSON — can't resolve deploy target."
  exit 1
fi

HOST=$(jq -r '.host' "$SFTP_JSON")
SSH_USER=$(jq -r '.username' "$SFTP_JSON")
SSH_PORT=$(jq -r '.port // 22' "$SFTP_JSON")
REMOTE_PATH=$(jq -r ".profiles.\"${DEPLOY_ENV}\".remotePath" "$SFTP_JSON")

if [ "$HOST" = "null" ] || [ -z "$HOST" ]; then
  err "Could not read .host from $SFTP_JSON"; exit 1
fi
if [ "$REMOTE_PATH" = "null" ] || [ -z "$REMOTE_PATH" ]; then
  err "No .profiles.${DEPLOY_ENV}.remotePath in $SFTP_JSON"; exit 1
fi

# ---- Env-specific labels -------------------------------------------------
if [ "$DEPLOY_ENV" = "prod" ]; then
  TARGET_URL="https://vampiresmc.com"
  ENV_LABEL="PRODUCTION"
  ENV_COLOR="$RED"
else
  TARGET_URL="https://stage.vampiresmc.com"
  ENV_LABEL="STAGING"
  ENV_COLOR="$YELLOW"
fi

echo ""
echo -e "${CYAN}═══ Vampires MC — ${ENV_COLOR}${ENV_LABEL}${NC}${CYAN} deploy ═══${NC}"
echo -e "  Target : ${BOLD}${SSH_USER}@${HOST}:${REMOTE_PATH}${NC}"
[ -n "$DRY_RUN" ] && warn "DRY RUN — no files will be uploaded"

# ---- Git info + prod gates ----------------------------------------------
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ "$DEPLOY_ENV" = "prod" ] && [ -z "$FORCE" ]; then
  if [ -n "$(git status --porcelain)" ]; then
    err "Working tree is dirty. Commit or stash your changes, or pass --force."
    exit 1
  fi
  if [ "$GIT_BRANCH" != "main" ]; then
    err "Not on 'main' branch (current: $GIT_BRANCH). Switch to main or pass --force."
    exit 1
  fi
fi

# ---- Prod confirmation prompt -------------------------------------------
if [ "$DEPLOY_ENV" = "prod" ] && [ -z "$DRY_RUN" ]; then
  echo ""
  echo -e "${RED}${BOLD}⚠  You are about to deploy to PRODUCTION${NC}"
  echo -e "   URL    : ${BOLD}${TARGET_URL}${NC}"
  echo -e "   Commit : ${BOLD}${GIT_SHA}${NC} on ${BOLD}${GIT_BRANCH}${NC}"
  [ -n "$FORCE" ] && echo -e "   Mode   : ${YELLOW}--force (gates bypassed)${NC}"
  echo ""
  read -r -p "Type 'yes' to continue: " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    err "Aborted."
    exit 1
  fi
fi

# ---- SCSS compile --------------------------------------------------------
COMPILE_TIME=0
if [ -z "$DRY_RUN" ]; then
  info "Compiling SCSS..."
  COMPILE_START=$(date +%s)
  npx --yes sass --no-source-map \
    styles/scss/main.scss:styles/css/main.css
  npx --yes sass --no-source-map --style=compressed \
    styles/scss/main.scss:styles/css/main.min.css
  COMPILE_END=$(date +%s)
  COMPILE_TIME=$((COMPILE_END - COMPILE_START))
  ok "SCSS compiled in $(format_time $COMPILE_TIME)"
else
  info "Skipping SCSS compile in dry-run"
fi

# ---- Setup temp files + cleanup trap ------------------------------------
IGNORE_JSON="$SCRIPT_DIR/ignore.json"
if [ ! -f "$IGNORE_JSON" ]; then
  err "Missing $IGNORE_JSON"; exit 1
fi

EXCLUDE_FILE=$(mktemp -t vmc-rsync-excludes.XXXXXX)
RSYNC_LOG=$(mktemp -t vmc-rsync-log.XXXXXX)
INDEX_BACKUP=""  # populated below if/when we bump the cache-buster

cleanup() {
  rm -f "$EXCLUDE_FILE" "$RSYNC_LOG"
  # Restore index.html to its pre-bump state so the working tree stays
  # clean after the deploy. Runs on success, failure, and interrupts.
  if [ -n "$INDEX_BACKUP" ] && [ -f "$INDEX_BACKUP" ]; then
    cp "$INDEX_BACKUP" "$PROJECT_ROOT/index.html"
    rm -f "$INDEX_BACKUP"
  fi
}
trap cleanup EXIT

jq -r '.patterns[]' "$IGNORE_JSON" > "$EXCLUDE_FILE"

# ---- Cache-bust CSS version string --------------------------------------
# Rewrites every `.css?v=<...>` in index.html to the current timestamp
# so browsers pick up fresh CSS immediately after deploy. The bump is
# auto-reverted by the cleanup trap after rsync (or on any failure), so
# the local working tree stays clean.
CACHE_BUST_VERSION=$(date '+%Y.%m.%d.%H%M')
if [ -z "$DRY_RUN" ]; then
  info "Bumping CSS cache-buster to v=${CACHE_BUST_VERSION}"
  INDEX_BACKUP=$(mktemp -t vmc-index-backup.XXXXXX)
  cp "$PROJECT_ROOT/index.html" "$INDEX_BACKUP"
  # BSD sed (macOS): -i '' is the in-place flag with empty backup suffix
  sed -i '' -E "s|(\.css\?v=)[0-9.]+|\1${CACHE_BUST_VERSION}|g" "$PROJECT_ROOT/index.html"
else
  info "Would bump CSS cache-buster to v=${CACHE_BUST_VERSION} (skipped in dry-run)"
fi

# ---- Rsync ---------------------------------------------------------------
info "Syncing files over SSH..."
UPLOAD_START=$(date +%s)

RSYNC_ARGS=(
  -avz
  --delete
  --stats
  --human-readable
  --exclude-from="$EXCLUDE_FILE"
  -e "ssh -p ${SSH_PORT}"
)
[ -n "$DRY_RUN" ] && RSYNC_ARGS+=(--dry-run)

# Tee into a log file so we can parse rsync's stats afterward while the
# user still sees progress live. `set -o pipefail` is on, so any rsync
# failure propagates through the pipeline.
rsync "${RSYNC_ARGS[@]}" \
  "${PROJECT_ROOT}/" \
  "${SSH_USER}@${HOST}:${REMOTE_PATH}/" \
  2>&1 | tee "$RSYNC_LOG"
RSYNC_OUTPUT=$(cat "$RSYNC_LOG")

UPLOAD_END=$(date +%s)
UPLOAD_TIME=$((UPLOAD_END - UPLOAD_START))

# ---- Parse rsync stats --------------------------------------------------
FILES_TRANSFERRED=$(echo "$RSYNC_OUTPUT" | grep -E "Number of regular files transferred" | awk -F: '{print $2}' | tr -d ' ,')
TOTAL_SIZE=$(echo "$RSYNC_OUTPUT" | grep -E "^Total file size" | awk -F: '{print $2}' | sed 's/^ *//;s/ *$//')
XFER_SIZE=$(echo "$RSYNC_OUTPUT" | grep -E "^Total transferred file size" | awk -F: '{print $2}' | sed 's/^ *//;s/ *$//')

DEPLOY_END=$(date +%s)
TOTAL_TIME=$((DEPLOY_END - DEPLOY_START))

# ---- Summary box --------------------------------------------------------
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  ${BOLD}${ENV_COLOR}${ENV_LABEL} DEPLOY SUMMARY${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "  Target         : ${BOLD}${TARGET_URL}${NC}"
echo -e "  Remote path    : ${DIM}${REMOTE_PATH}${NC}"
echo -e "  Git            : ${BOLD}${GIT_SHA}${NC} (${GIT_BRANCH})"
echo -e "  Cache bust     : ${BOLD}v=${CACHE_BUST_VERSION}${NC}"
echo -e "  Files moved    : ${FILES_TRANSFERRED:-0}"
echo -e "  Total size     : ${TOTAL_SIZE:-unknown}"
echo -e "  Transferred    : ${XFER_SIZE:-unknown}"
echo -e "  Compile time   : $(format_time $COMPILE_TIME)"
echo -e "  Upload time    : $(format_time $UPLOAD_TIME)"
echo -e "  Total time     : ${GREEN}$(format_time $TOTAL_TIME)${NC}"
echo -e "  Timestamp      : $(date '+%Y-%m-%d %H:%M:%S')"
[ -n "$DRY_RUN" ] && echo -e "  ${YELLOW}Mode           : DRY RUN (nothing uploaded)${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ -n "$DRY_RUN" ]; then
  warn "Dry-run complete. Re-run without --dry-run to push for real."
else
  ok "${ENV_LABEL} deploy complete → ${TARGET_URL}"
fi
