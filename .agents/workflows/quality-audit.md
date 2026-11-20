# Playbook: Quality and Compliance Audit (.agents/workflows/quality-audit.md)

Playbook for periodic technical health and compliance audits across the repository.

## Audit Steps

1. **Code and Typing Audit:**
   - Run `make lint` to ensure zero violations in Ruff, strict Mypy compliance, and zero dead code in Vulture.

2. **SAST and Security Audit:**
   - Run `make semgrep` to ensure zero static security violations.

3. **Test Suite and Coverage Audit:**
   - Run `make test` and inspect the `pytest-cov` coverage report, ensuring >= 90% floor (preferably 100%).

4. **Secrets and Supply Chain Audit:**
   - Run `make scan` for full Git history credential analysis via Gitleaks and strict CVE analysis via Pip-Audit.
