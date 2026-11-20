# Playbook: Systematic Bug Fixing (.agents/workflows/bug-fixing.md)

Recommended workflow for investigating and fixing defects by AI agents.

## Steps

1. **Reproduction via Automated Test:**
   - Never alter production code before reproducing the defect with an automated test.
   - Author a test in the appropriate test layer (`unit/`, `integration/`, or `e2e/`) that fails specifically highlighting the bug.
   - Prove that the test fails for the exact root cause investigated.

2. **Root Cause Diagnosis:**
   - Trace and isolate the fundamental issue rather than patching superficial symptoms.
   - Analyze potential side effects on adjacent components.

3. **Correction and Green:**
   - Apply minimal production code adjustments to make the reproduction test pass.
   - Run the full parallel test suite (`make test`).

4. **Quality Gate Verification:**
   - Run `make check`.
   - Commit the change with Conventional Commit prefix `fix: <message in English>`.
