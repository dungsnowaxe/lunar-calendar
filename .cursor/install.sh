#!/usr/bin/env bash
# Idempotent repository bootstrap for the Lịch Âm lunar-calendar app.
#
# Heavy, stable prerequisites (Node 24, Docker, the Supabase CLI) normally
# come baked into the Cloud Agent base snapshot; the guarded blocks below only
# reinstall them when they are missing, so this script also works on a plain
# default image. Per-boot services (the Docker daemon and the Supabase stack)
# live in start.sh, and the dev server lives in the "web" terminal.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# --- Node 24 (matches .devcontainer/devcontainer.json; the test suites use
#     `node --test *.ts`, which needs Node's built-in TypeScript support). ---
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
fi
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh"
nvm install 24 >/dev/null
nvm alias default 24 >/dev/null
export PATH="$(dirname "$(nvm which 24)"):$PATH"
echo "node $(node -v)"

# --- Docker (only used at runtime by the local Supabase stack). ---
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker.io fuse-overlayfs uidmap iptables
fi

# --- Supabase CLI. ---
if ! command -v supabase >/dev/null 2>&1; then
  echo "Installing Supabase CLI..."
  ARCH="$(dpkg --print-architecture)"
  curl -fsSL "https://github.com/supabase/cli/releases/latest/download/supabase_linux_${ARCH}.tar.gz" \
    -o /tmp/supabase.tar.gz
  tar -xzf /tmp/supabase.tar.gz -C /tmp
  sudo mv /tmp/supabase /usr/local/bin/supabase
fi

# --- JavaScript dependencies (pnpm ships with the base image via corepack). ---
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

# --- Local dev credentials for the bundled Supabase stack. ---
# These are the well-known, public Supabase local-development keys — NOT
# secrets. Every `supabase start` with the default config issues this same
# anon key, so it is safe to write here for a login-less local database.
LOCAL_SUPABASE_URL="http://127.0.0.1:54321"
LOCAL_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

write_env() {
  local target="$1"
  cat > "$target" <<EOF
SUPABASE_URL=$LOCAL_SUPABASE_URL
SUPABASE_ANON_KEY=$LOCAL_ANON_KEY
EOF
}

# Repo-root .env is read by vite.config.ts; apps/web/.dev.vars is read by the
# Cloudflare workerd runtime that runs the TanStack Start server functions.
[ -f .env ] || write_env .env
[ -f apps/web/.dev.vars ] || write_env apps/web/.dev.vars

echo "install.sh: done"
