#!/usr/bin/env bash
# Per-boot startup: bring up the Docker daemon and the local Supabase stack
# (Postgres + PostgREST + Kong + the rest of the default services) that the
# app's server functions talk to. Idempotent and safe to re-run.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Inside the nested Cloud Agent VM, Docker's networking needs the legacy
# iptables backend; the default nft backend cannot program the bridge rules,
# which otherwise silently breaks host <-> container and container <-> container
# traffic (Kong/PostgREST become unreachable).
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy   >/dev/null 2>&1 || true
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy >/dev/null 2>&1 || true

# --- Docker daemon (fuse-overlayfs storage driver works without a privileged
#     host kernel module). ---
if ! sudo docker info >/dev/null 2>&1; then
  echo "Starting dockerd..."
  sudo bash -c 'nohup dockerd --storage-driver=fuse-overlayfs >/var/log/dockerd.log 2>&1 &'
  for _ in $(seq 1 30); do
    sudo docker info >/dev/null 2>&1 && break
    sleep 2
  done
  if ! sudo docker info >/dev/null 2>&1; then
    echo "dockerd failed to start; recent log:" >&2
    sudo tail -n 30 /var/log/dockerd.log >&2 || true
    exit 1
  fi
fi
# Let the repo user drive Docker (and the Supabase CLI) without sudo.
sudo chmod 666 /var/run/docker.sock || true

# --- Supabase local stack. ---
if docker ps --format '{{.Names}}' | grep -q '^supabase_db_'; then
  echo "Supabase already running."
else
  echo "Starting Supabase..."
  supabase start
fi

supabase status 2>/dev/null || true
echo "start.sh: done"
