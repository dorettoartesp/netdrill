#!/usr/bin/env bash
# Runs Semgrep SAST rules in offline mode:
#   semgrep.sh test -> validates rules against .semgrep/test_cases.py
#   semgrep.sh scan -> inspects backend/src against local rules
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

run() {
  if command -v semgrep >/dev/null 2>&1; then
    semgrep scan --metrics=off --disable-version-check "$@"
  elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    docker run --rm --network none --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$ROOT:/src:ro" -w /src \
      semgrep/semgrep:latest semgrep scan --metrics=off --disable-version-check "$@"
  else
    echo "Error: Neither local semgrep binary nor Docker daemon is operational." >&2
    echo "Please install semgrep locally or start Docker service to run SAST scan." >&2
    exit 1
  fi
}

case "${1:-scan}" in
  test)
    run --test --config .semgrep/rules.yml .semgrep/test_cases.py
    ;;
  scan)
    run --error --quiet --exclude .semgrep --config .semgrep/rules.yml .
    ;;
  *)
    echo "Usage: $0 test|scan" >&2
    exit 2
    ;;
esac
