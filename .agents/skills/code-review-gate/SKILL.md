---
name: code-review-gate
description: Quality gate verification procedure prior to code submission
---

# Skill: Code Review Gate

## Validation Procedure

Before completing any task, submitting a PR, or creating commits, the agent must execute:

```bash
make check
```

This command sequentially verifies:
1. `make lint`: Stack-aware linter and formatter checks.
2. `make semgrep`: Rule verification and SAST scan of source code.
3. `make test`: Automated test suite execution with coverage validation (>= 90%, preferably 100%).
4. `make scan`: Git history secret audit with Gitleaks.
5. `make portability`: Verification against hardcoded local filesystem paths (`check-portability.sh`).
6. `git diff --check`: Verification against orphan whitespaces or merge artifacts.

Exit code must strictly be 0.
