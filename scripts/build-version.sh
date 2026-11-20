#!/usr/bin/env bash
# Automated build versioning utility based on Conventional Commits and Git state.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"

SHORT_SHA="$(git -C "$ROOT" rev-parse --short=7 HEAD 2>/dev/null || echo "unknown")"
COMMIT_TIMESTAMP="$(git -C "$ROOT" log -1 --format=%cd --date=format:%Y%m%d%H%M%S 2>/dev/null || date -u +%Y%m%d%H%M%S)"

DIRTY=""
if [ -n "$(git -C "$ROOT" status --porcelain 2>/dev/null)" ]; then
  DIRTY=".dirty"
fi

BUILD_VERSION="${BASE_VERSION}+${COMMIT_TIMESTAMP}.${SHORT_SHA}${DIRTY}"

case "${1:-full}" in
  base)
    echo "$BASE_VERSION"
    ;;
  full)
    echo "$BUILD_VERSION"
    ;;
  json)
    cat <<EOF
{
  "base_version": "$BASE_VERSION",
  "build_version": "$BUILD_VERSION",
  "commit_sha": "$SHORT_SHA",
  "timestamp": "$COMMIT_TIMESTAMP",
  "dirty": $([ -n "$DIRTY" ] && echo "true" || echo "false")
}
EOF
    ;;
  stamp)
    TARGET_DIR="${2:-$ROOT/dist}"
    mkdir -p "$TARGET_DIR"
    "$0" json > "$TARGET_DIR/build-info.json"
    echo "$BUILD_VERSION" > "$TARGET_DIR/.build-version"
    echo "Build metadata stamped to $TARGET_DIR/build-info.json"
    ;;
  *)
    echo "Usage: $0 [base|full|json|stamp [directory]]" >&2
    exit 2
    ;;
esac
