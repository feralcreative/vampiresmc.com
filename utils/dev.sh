#!/bin/bash
# ============================================================
# vampiresmc.com — local dev server
# ============================================================
# Serves the repo root as a static site on :3054.
#
# Usage:
#   ./utils/dev.sh
#
# Ctrl+C to stop.
# ============================================================

set -e

DEV_PORT=3054

# Resolve repo root relative to this script
cd "$(dirname "$0")/.."

# Per the project rule: never run multiple servers on different
# ports. If something is already on our port, kill it first.
if lsof -nP -iTCP:$DEV_PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "port $DEV_PORT in use — stopping existing process"
  lsof -nP -iTCP:$DEV_PORT -sTCP:LISTEN -t | xargs kill -9 2>/dev/null || true
  sleep 0.3
fi

echo ""
echo "vampiresmc.com dev server"
echo "  http://localhost:$DEV_PORT"
echo ""

python3 -m http.server $DEV_PORT
