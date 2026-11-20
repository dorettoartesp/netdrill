#!/usr/bin/env bash
# Automated test suite for project bootstrap wizard (scripts/init-project.sh)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

SANDBOX_DIR=$(mktemp -d /tmp/test-bootstrap-agentic.XXXXXX)
trap 'rm -rf "${SANDBOX_DIR}"' EXIT INT TERM

echo "==> Cloning repository into isolated sandbox: ${SANDBOX_DIR}"
(
    cd "${REPO_DIR}"
    tar --exclude=".git" --exclude="site" -cf - . | (cd "${SANDBOX_DIR}" && tar -xf -)
)

cd "${SANDBOX_DIR}"
git init -b main
git config user.name "Sandbox Tester"
git config user.email "test@sandbox.local"
git add .
git commit -m "chore: snapshot for bootstrap test"

# Test 1: Safety guard blocks canonical template repo without --force
echo "==> Test 1: Verifying safety guard blocks canonical template execution without --force..."
git remote add origin "https://github.com/dorettoartesp/agentic-tmpl.git"
if bash scripts/init-project.sh --non-interactive --name "Acme Logistics" --slug "acme-logistics" 2>/dev/null; then
    echo "❌ Test 1 Failed: Expected safety guard to block execution, but it succeeded." >&2
    exit 1
fi
echo "✓ Safety guard successfully blocked execution without --force."
git remote remove origin

# Test 2: --dry-run does not mutate files
echo "==> Test 2: Verifying --dry-run does not mutate files..."
bash scripts/init-project.sh --dry-run --non-interactive --name "Dry Run Test" --slug "dry-run-test"
if grep -q "dry-run-test" README.md; then
    echo "❌ Test 2 Failed: --dry-run mutated README.md" >&2
    exit 1
fi
echo "✓ Dry-run executed safely without writing changes."

# Test 3: Full bootstrap execution with --reset-git
echo "==> Test 3: Executing full bootstrap wizard..."
bash scripts/init-project.sh \
    --name "Acme Logistics" \
    --slug "acme-logistics" \
    --author "Acme Team" \
    --email "dev@acme.com" \
    --reset-git \
    --non-interactive

# Assertions
assert_contains() {
    local file="$1"
    local pattern="$2"
    if ! grep -q "${pattern}" "${file}"; then
        echo "❌ Assertion Failed: ${file} missing '${pattern}'" >&2
        exit 1
    fi
}

echo "==> Verifying metadata replacements..."
assert_contains "README.md" "# Acme Logistics"
assert_contains "README.md" "acme-logistics"
assert_contains "mkdocs.yml" "site_name: \"Acme Logistics Documentation\""
assert_contains "mkdocs.yml" "acme-logistics"
assert_contains "docs/index.md" "acme-logistics"
assert_contains "docker-compose.yml" "acme-logistics-postgres"
assert_contains "docker-compose.yml" "acme-logistics-valkey"
assert_contains "CONTRIBUTING.md" "Conventional Commits"
assert_contains "SECURITY.md" "Responsible Vulnerability Disclosure"
assert_contains ".env.local.example" "POSTGRES_DB=appdb"
assert_contains "docs/adr/0001-record-architecture-decisions.md" "Record Architecture Decisions"

echo "==> Verifying Git history and initial commit..."
COMMIT_COUNT=$(git rev-list --count HEAD)
if [[ "${COMMIT_COUNT}" -ne 1 ]]; then
    echo "❌ Assertion Failed: Expected exactly 1 root commit, found ${COMMIT_COUNT}." >&2
    exit 1
fi

COMMIT_MSG=$(git log -1 --pretty=%B)
if [[ "${COMMIT_MSG}" != *"initialize project from template (Acme Logistics)"* ]]; then
    echo "❌ Assertion Failed: Unexpected commit message: '${COMMIT_MSG}'" >&2
    exit 1
fi

echo "==> Verifying changelog reset..."
assert_contains "CHANGELOG.md" "initialize project from template (Acme Logistics)"

echo "==> Verifying documentation build..."
make docs
rm -rf site

echo "==> Verifying quality gate..."
make check

echo ""
echo "================================================================="
echo " ✓ All bootstrap wizard tests passed successfully!"
echo "================================================================="
