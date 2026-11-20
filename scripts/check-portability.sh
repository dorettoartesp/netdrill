#!/usr/bin/env bash
# Verifies zero hardcoded local filesystem paths (e.g. /home/<user>, /Users/<user>, file:///home/...) in git-tracked files.
# Usage:
#   scripts/check-portability.sh          # Scans all tracked files
#   scripts/check-portability.sh staged   # Scans staged index files (pre-commit)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

MODE="${1:-all}"
EXTRA_ARGS=()

if [[ "${MODE}" == "staged" || "${MODE}" == "--staged" ]]; then
    EXTRA_ARGS+=(--cached)
fi

# Regex patterns matching local machine user directories and absolute file URIs
PATTERN="(/home/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+|/Users/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+|[a-zA-Z]:(/[Uu]sers/|\\\\[Uu]sers\\\\)[a-zA-Z0-9_.-]+(/[a-zA-Z0-9_.-]+|\\\\[a-zA-Z0-9_.-]+)|file:///(home|Users|[a-zA-Z]:))"

# Search git tracked files, excluding this script and files containing portability-ignore
VIOLATIONS=$(git -C "${ROOT}" grep -n -I -E "${PATTERN}" "${EXTRA_ARGS[@]}" -- ':!scripts/check-portability.sh' 2>/dev/null | grep -v "portability-ignore" || true)

if [[ -n "${VIOLATIONS}" ]]; then
    echo "❌ Portability Gate Failure:" >&2
    echo "Hardcoded local filesystem paths or absolute user URIs detected in tracked files:" >&2
    echo "" >&2
    echo "${VIOLATIONS}" | while IFS= read -r line; do
        echo "  👉 ${line}" >&2
    done
    echo "" >&2
    echo "💡 Remediation:" >&2
    echo "  1. Use repository-relative paths (e.g., 'docs/ARCHITECTURE.md', 'frontend/prototypes/')." >&2
    echo "  2. Use environment variables (e.g., '\$HOME', '\${XDG_CONFIG_HOME}')." >&2
    echo "  3. In rare documentation examples, append '# portability-ignore' to bypass." >&2
    exit 1
fi

echo "✓ Portability check passed: zero hardcoded local filesystem paths detected."
exit 0
