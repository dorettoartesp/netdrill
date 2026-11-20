# Security Policy

## Responsible Vulnerability Disclosure
For potential security issues discovered within this template or derived projects:
- Maintain confidentiality: avoid opening public issue reports or publishing vulnerabilities before remediation.
- Report findings privately to the repository owner or designated security contacts.
- Include actionable reproduction details, potential severity assessment, and affected components.

## Security Engineering Principles
1. **Zero Credential Retention in Git:**
   - Keys, tokens, certificates, and runtime configurations (`.env*`, `.secrets/`, `.data/`) must remain excluded from Git tracking.
   - Enforced automatically by `scripts/gitleaks.sh` on pre-commit and via `make scan`.

2. **Automated Static Security Analysis (SAST):**
   - Security-focused static analysis runs via Semgrep (`make semgrep`).
   - Prevents common pitfalls including hardcoded secret strings, unparameterized query assembly, and disabled TLS verification.

3. **Filesystem Portability & Leak Prevention:**
   - Machine-specific path prefixes (`/home/`, `/Users/`, `file:///...`) are verified by `scripts/check-portability.sh` (`make portability`).
   - Keeps repository portable across environments without exposing local workstation paths.

4. **Dependency Vulnerability Management:**
   - Dependencies added by the selected language ecosystem must undergo regular vulnerability auditing.
