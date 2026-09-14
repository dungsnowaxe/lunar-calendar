#!/usr/bin/env bash
# Shared paths and helpers for verify-lunar-calendar scripts.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${SKILL_DIR}/../../.." && pwd)"
RUNS_DIR="${SKILL_DIR}/runs"
ARTIFACTS_DIR="${SKILL_DIR}/artifacts"
DEFAULT_PORT=4317
DEFAULT_HOST="127.0.0.1"

resolve_run_dir() {
  local run_id="${1:-}"
  if [[ -n "${run_id}" ]]; then
    echo "${RUNS_DIR}/${run_id}"
    return
  fi
  if [[ -f "${RUNS_DIR}/CURRENT" ]]; then
    run_id="$(tr -d '[:space:]' <"${RUNS_DIR}/CURRENT")"
    echo "${RUNS_DIR}/${run_id}"
    return
  fi
  echo "No active run. Pass RUN_ID or run bin/launch first." >&2
  return 1
}

load_run_env() {
  local run_dir
  run_dir="$(resolve_run_dir "${1:-}")"
  # shellcheck disable=SC1091
  source "${run_dir}/env.sh"
  export RUN_DIR="${run_dir}"
  export RUN_ID URL HOST PORT PID_FILE LOG_FILE ARTIFACT_DIR
}

require_repo_env() {
  if [[ ! -f "${REPO_ROOT}/.env" && ! -f "${REPO_ROOT}/.dev.vars" ]]; then
    echo "Missing ${REPO_ROOT}/.env (or .dev.vars). Copy .env.example and set SUPABASE_URL / SUPABASE_ANON_KEY." >&2
    return 1
  fi
}
