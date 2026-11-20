#!/usr/bin/env bash
# Runs gitleaks scanning over the repository: `staged` (pre-commit) or `history` (make scan).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

run() {
  if command -v gitleaks >/dev/null 2>&1; then
    case "${1:-history}" in
      staged) gitleaks git --pre-commit --staged "$ROOT" --redact --no-banner ;;
      history) gitleaks git "$ROOT" --redact --no-banner ;;
      *) echo "Usage: $0 staged|history" >&2; exit 2 ;;
    esac
  elif command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    case "${1:-history}" in
      staged)
        docker run --rm --network none --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$ROOT:/repo:ro" -w /repo \
          zricethezav/gitleaks:latest git --pre-commit --staged /repo --redact --no-banner
        ;;
      history)
        docker run --rm --network none --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$ROOT:/repo:ro" -w /repo \
          zricethezav/gitleaks:latest git /repo --redact --no-banner
        ;;
      *)
        echo "Usage: $0 staged|history" >&2
        exit 2
        ;;
    esac
  else
    echo "Error: Neither local gitleaks binary nor Docker daemon is operational." >&2
    echo "Please install gitleaks locally or start Docker service to run secret scans." >&2
    exit 1
  fi
}

run "${1:-history}"
