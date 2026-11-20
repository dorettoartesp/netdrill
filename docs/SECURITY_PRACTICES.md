# Security Practices

## 1. Zero Secrets in Version Control

Never commit secrets, tokens, private keys, or credentials.
- **Gitleaks:** Runs automatically in pre-commit (staged files) and via `make scan` (full repository history).
- **Environment Separation:** Injects secrets exclusively via environment variables or secret vaults.

## 2. Static Application Security Testing (SAST)

Semgrep scans the codebase using project rules in `.semgrep/rules.yml`:
- Blocks insecure TLS configurations.
- Blocks raw SQL string interpolations.
- Blocks hardcoded secrets.

Run SAST manually with:
```bash
make semgrep
```

## 3. Portability and Path Leak Prevention

Hardcoded absolute machine paths (`/home/<user>`, `/Users/<user>`, `C:\Users\`, `file:///home/`) leak host usernames and break cross-machine portability. <!-- portability-ignore -->
- The gate `scripts/check-portability.sh` audits all tracked files in Git.
- Enforced on every `git commit` via pre-commit and on `make check`.

## 4. Responsible Vulnerability Disclosure

Vulnerabilities must never be posted in public issues. Refer to `SECURITY.md` in the repository root for contact details and responsible disclosure procedures.

## 5. Four-Tier Environment Security Model

Configurations and credentials follow 12-Factor principles:
- `.env.local.example`: Developer workstation defaults.
- `.env.dev.example`: Development and automated pipeline environment.
- `.env.hml.example`: Staging environment mirroring production network and security isolation.
- `.env.prd.example`: Production where all secrets are strictly injected via cloud vaults (KMS, HashiCorp Vault, AWS Secrets Manager) and never written to disk or logs.
