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
# Run apt fully non-interactively and keep existing conffiles, otherwise the
# fuse3 postinst stops on an /etc/fuse.conf prompt and fails the build.
if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    -o Dpkg::Options::=--force-confdef \
    -o Dpkg::Options::=--force-confold \
    docker.io fuse-overlayfs uidmap iptables
fi

# --- Supabase CLI (pinned version + checksum-verified for a reproducible,
#     integrity-checked bootstrap instead of an unverified `latest`). ---
SUPABASE_CLI_VERSION="2.117.0"
if ! command -v supabase >/dev/null 2>&1; then
  echo "Installing Supabase CLI v${SUPABASE_CLI_VERSION}..."
  ARCH="$(dpkg --print-architecture)"
  base="https://github.com/supabase/cli/releases/download/v${SUPABASE_CLI_VERSION}"
  tarball="supabase_${SUPABASE_CLI_VERSION}_linux_${ARCH}.tar.gz"
  curl -fsSL "${base}/${tarball}" -o "/tmp/${tarball}"
  curl -fsSL "${base}/checksums.txt" -o /tmp/supabase_checksums.txt
  ( cd /tmp && grep " ${tarball}\$" supabase_checksums.txt | sha256sum -c - )
  tar -xzf "/tmp/${tarball}" -C /tmp supabase
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

# Set KEY=VALUE in an env file, replacing any existing line for that key and
# leaving other entries untouched. Existence of the file is not treated as
# "already configured": a stale .env / .dev.vars (e.g. left over from a hosted
# setup or a reused workspace) is corrected so the app always targets the
# bundled local stack.
set_env_var() {
  local file="$1" key="$2" value="$3"
  touch "$file"
  if grep -q "^${key}=" "$file"; then
    grep -v "^${key}=" "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
  fi
  printf '%s=%s\n' "$key" "$value" >> "$file"
}

# Repo-root .env is read by vite.config.ts; apps/web/.dev.vars is read by the
# Cloudflare workerd runtime that runs the TanStack Start server functions.
for envfile in .env apps/web/.dev.vars; do
  set_env_var "$envfile" SUPABASE_URL "$LOCAL_SUPABASE_URL"
  set_env_var "$envfile" SUPABASE_ANON_KEY "$LOCAL_ANON_KEY"
done

echo "install.sh: done"
