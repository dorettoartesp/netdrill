#!/usr/bin/env bash
# Automated test suite verifying the adaptive multi-stack Makefile
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "==> Testing Adaptive Makefile Dispatch..."

TEST_SANDBOX=$(mktemp -d /tmp/test-adaptive-make.XXXXXX)
trap 'rm -rf "${TEST_SANDBOX}"' EXIT INT TERM

cp "${REPO_DIR}/Makefile" "${TEST_SANDBOX}/Makefile"

assert_dispatch() {
    local scenario="$1"
    local target="$2"
    local expected_pattern="$3"
    local output

    output=$(make -C "${TEST_SANDBOX}" -n "${target}" 2>&1 || true)
    if ! echo "${output}" | grep -qE "${expected_pattern}"; then
        echo "❌ [${scenario}] Assertion Failed: 'make -n ${target}' did not match pattern '${expected_pattern}'" >&2
        echo "Actual output:" >&2
        echo "${output}" >&2
        exit 1
    fi
    echo "✓ [${scenario}] 'make -n ${target}' dispatched '${expected_pattern}'"
}

# 1. Uninitialized Canvas Scenario
echo "==> Test 1: Uninitialized Canvas"
assert_dispatch "Uninitialized" "test" "No stack initialized yet"
assert_dispatch "Uninitialized" "lint" "No stack initialized yet"

# 2. C# (.NET) Scenario
echo "==> Test 2: C# (.NET) Detection"
touch "${TEST_SANDBOX}/App.csproj"
assert_dispatch "C# .csproj" "test" "dotnet test"
assert_dispatch "C# .csproj" "lint" "dotnet format"
rm -f "${TEST_SANDBOX}/App.csproj"

touch "${TEST_SANDBOX}/Solution.sln"
assert_dispatch "C# .sln" "test" "dotnet test"
rm -f "${TEST_SANDBOX}/Solution.sln"

# 3. Java Maven Scenario
echo "==> Test 3: Java Maven Detection"
touch "${TEST_SANDBOX}/pom.xml"
assert_dispatch "Java Maven" "test" "mvn test"
rm -f "${TEST_SANDBOX}/pom.xml"

# 4. Java Gradle Scenario
echo "==> Test 4: Java Gradle Detection"
touch "${TEST_SANDBOX}/build.gradle"
assert_dispatch "Java Gradle" "test" "(./gradlew test|gradle test)"
rm -f "${TEST_SANDBOX}/build.gradle"

# 5. Rust Scenario
echo "==> Test 5: Rust Detection"
touch "${TEST_SANDBOX}/Cargo.toml"
assert_dispatch "Rust" "test" "cargo test"
assert_dispatch "Rust" "lint" "cargo clippy"
rm -f "${TEST_SANDBOX}/Cargo.toml"

# 6. Node.js Scenario
echo "==> Test 6: Node.js Detection"
touch "${TEST_SANDBOX}/package.json"
assert_dispatch "Node.js" "test" "(npm test|pnpm test)"
assert_dispatch "Node.js" "lint" "npm run lint"
rm -f "${TEST_SANDBOX}/package.json"

# 7. Python Scenario
echo "==> Test 7: Python Detection"
touch "${TEST_SANDBOX}/pyproject.toml"
assert_dispatch "Python" "test" "(pytest|uv run pytest)"
assert_dispatch "Python" "lint" "(ruff|uv run ruff)"
rm -f "${TEST_SANDBOX}/pyproject.toml"

# 8. Go Scenario
echo "==> Test 8: Go Detection"
touch "${TEST_SANDBOX}/go.mod"
assert_dispatch "Go" "test" "go test"
rm -f "${TEST_SANDBOX}/go.mod"

# 9. Explicit Override via stack.mk
echo "==> Test 9: Explicit stack.mk Override"
cat > "${TEST_SANDBOX}/stack.mk" <<EOF
CMD_TEST = custom-runner test-all
CMD_LINT = custom-linter check
EOF
touch "${TEST_SANDBOX}/Cargo.toml" # should be overridden by stack.mk
assert_dispatch "stack.mk Override" "test" "custom-runner test-all"
assert_dispatch "stack.mk Override" "lint" "custom-linter check"
rm -f "${TEST_SANDBOX}/stack.mk" "${TEST_SANDBOX}/Cargo.toml"

echo "==> All 9 adaptive Makefile dispatch scenarios passed successfully!"
