#!/usr/bin/env bash
# Runs the TanStack Start dev server (http://localhost:3000) under Node 24.
# Used as the "web" terminal command for the Cloud Agent environment.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
# Put Node 24 ahead of any other node on PATH.
export PATH="$(dirname "$(nvm which 24 2>/dev/null || command -v node)"):$PATH"

exec pnpm dev
