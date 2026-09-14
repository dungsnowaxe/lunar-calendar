#!/usr/bin/env bash
# Shared paths and helpers for verify-lunar-calendar scripts.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${SKILL_DIR}/../../.." && pwd)"
RUNS_DIR="${SKILL_DIR}/runs"
ARTIFACTS_DIR="${SKILL_DIR}/artifacts"
DEFAULT_PORT=4317
DEFAULT_HOST="127.0.0.1"

# Safe path-component run IDs only (no spaces, quotes, or shell metacharacters).
validate_run_id() {
  local id="${1:-}"
  if [[ ! "${id}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$ ]]; then
    echo "Invalid RUN_ID '${id}'. Use 1-64 chars of [A-Za-z0-9._-], starting with alphanumeric." >&2
    return 1
  fi
}

resolve_run_dir() {
  local run_id="${1:-}"
  if [[ -n "${run_id}" ]]; then
    validate_run_id "${run_id}"
    echo "${RUNS_DIR}/${run_id}"
    return
  fi
  if [[ -f "${RUNS_DIR}/CURRENT" ]]; then
    run_id="$(tr -d '[:space:]' <"${RUNS_DIR}/CURRENT")"
    validate_run_id "${run_id}"
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

env_file_get() {
  local key="$1" file="$2"
  local line value
  line="$(grep -E "^[[:space:]]*${key}=" "${file}" | tail -n 1 || true)"
  if [[ -z "${line}" ]]; then
    printf ''
    return 0
  fi
  value="${line#*=}"
  value="${value%$'\r'}"
  if [[ "${value}" =~ ^\".*\"$ ]]; then
    value="${value:1:${#value}-2}"
  elif [[ "${value}" =~ ^\'.*\'$ ]]; then
    value="${value:1:${#value}-2}"
  fi
  printf '%s' "${value}"
}

require_repo_env() {
  local file=""
  if [[ -f "${REPO_ROOT}/.env" ]]; then
    file="${REPO_ROOT}/.env"
  elif [[ -f "${REPO_ROOT}/.dev.vars" ]]; then
    file="${REPO_ROOT}/.dev.vars"
  else
    echo "Missing ${REPO_ROOT}/.env (or .dev.vars). Copy .env.example and set SUPABASE_URL / SUPABASE_ANON_KEY." >&2
    return 1
  fi

  local url key
  url="$(env_file_get SUPABASE_URL "${file}")"
  key="$(env_file_get SUPABASE_ANON_KEY "${file}")"

  if [[ -z "${url}" || -z "${key}" ]]; then
    echo "Env file ${file} must set non-empty SUPABASE_URL and SUPABASE_ANON_KEY." >&2
    return 1
  fi
  if [[ "${url}" == *"your-project-url"* || "${key}" == *"your-publishable-key"* ]]; then
    echo "Env file ${file} still has placeholder Supabase values from .env.example." >&2
    return 1
  fi
}

# True when pid looks like this run's Vite listener (host+port fingerprint).
pid_matches_run() {
  local pid="$1" host="$2" port="$3"
  local cmd
  if ! kill -0 "${pid}" 2>/dev/null; then
    return 1
  fi
  cmd="$(ps -p "${pid}" -o command= 2>/dev/null || true)"
  if [[ -z "${cmd}" ]]; then
    return 1
  fi
  # Match the exact host/port args we pass to vite.
  [[ "${cmd}" == *"--host ${host}"* && "${cmd}" == *"--port ${port}"* ]]
}
