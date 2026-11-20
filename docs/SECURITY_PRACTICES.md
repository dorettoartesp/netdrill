# Security Practices — NetDrill

## 1. Secrets and Credential Protection
- **Zero Secrets in Git:** All secrets (`TURSO_AUTH_TOKEN`, `APP_PIN`, etc.) are injected strictly via environment variables or secret vaults.
- **Automated Leaks Detection:** Gitleaks scans history and staged commits on every `make check` and pre-commit hook.
- **Static Application Security Testing (SAST):** Semgrep runs rules in `.semgrep/rules.yml` enforcing secure coding standards.

## 2. Authentication and Session Management
- **Minimalist PIN Protection:** A personal master PIN is verified server-side.
- **Secure Cookie Flags:** The session cookie is emitted with `HttpOnly`, `SameSite=Strict`, and `Secure` (in production), preventing XSS token theft.

## 3. Database Security
- Turso DB connections utilize HTTPS/TLS and token-based authentication.
- All SQL queries use parameterized arguments (`args: [...]`) to completely prevent SQL injection vulnerabilities.
