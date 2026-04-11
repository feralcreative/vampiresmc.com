#!/bin/bash
# ============================================================================
# Vampires MC — Production deploy wrapper
# Deploys to vampiresmc.com. Pass --dry-run to preview, --force to bypass
# the git-clean / on-main gates (confirmation prompt still fires).
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DEPLOY_ENV="prod"
exec "$SCRIPT_DIR/deploy.sh" "$@"
