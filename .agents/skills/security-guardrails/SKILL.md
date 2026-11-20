---
name: security-guardrails
description: Security validation protocol, credential leak scanning, and SAST auditing
---

# Skill: Security Guardrails

## Mandatory Checklist

1. **Secret Leak Detection:**
   - Run `make scan` and `scripts/gitleaks.sh staged`.
   - Verify that no tokens, private keys, passwords, or `.env` files are added.

2. **SAST Security Audit (Semgrep):**
   - Run `make semgrep`.
   - No HTTP request may disable TLS certificate validation (`verify=False`).
   - No database query may contain raw string interpolation (SQL Injection risk).
   - No hardcoded secret keys in settings or application code.

3. **Dependency Vulnerability Auditing:**
   - Run stack-appropriate dependency auditing (`cargo audit`, `npm audit`, `dotnet list package --vulnerable`, `pip-audit`).
   - Zero known CVEs allowed in the dependency tree.

4. **Logging Sanitization:**
   - Ensure logs never record authentication tokens, passwords, or user PII.

5. **Portability Auditing:**
   - Run `make portability` (`scripts/check-portability.sh`).
   - Zero hardcoded local machine paths (`/home/`, `/Users/`, `file:///...`).
