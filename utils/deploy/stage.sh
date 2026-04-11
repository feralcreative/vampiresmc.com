#!/bin/bash
# ============================================================================
# Vampires MC — Staging deploy wrapper
# Deploys to stage.vampiresmc.com. Pass --dry-run to preview.
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DEPLOY_ENV="stage"
exec "$SCRIPT_DIR/deploy.sh" "$@"
