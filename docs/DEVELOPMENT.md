# Development Guide

## 1. Quick Reference: Makefile Targets

| Target | Description |
|---|---|
| `make help` | Display available targets with descriptions |
| `make dev` | Start local development server (stack-aware) |
| `make lint` | Run linter and formatting checks (stack-aware) |
| `make test` | Run automated test suite (stack-aware) |
| `make docker-up` | Start local backing infrastructure (PostgreSQL, Valkey) |
| `make docker-down` | Stop local backing infrastructure |
| `make docker-logs` | Follow logs from local infrastructure services |
| `make scan` | Run credential leak audit (`gitleaks`) |
| `make semgrep` | Run SAST security scan with local rules |
| `make portability` | Verify zero hardcoded local filesystem paths |
| `make check` | The mandatory quality gate: runs `lint`, `semgrep`, `test`, `scan`, and `portability` |
| `make new-project` | Rebrand and bootstrap template for a new project |
| `make test-bootstrap` | Run automated test suite verifying bootstrap wizard |
| `make docs` | Build documentation portal (stack-adaptive, defaults to MkDocs) |
| `make docs-serve` | Serve local interactive documentation portal (stack-adaptive) |
| `make changelog` | Regenerate CHANGELOG.md via git-cliff |
| `make version` | Display base version and Git-derived build version |

## 2. Four-Environment Architecture

The project adheres to a 12-Factor four-tier environment structure:
- **`local`:** Local workstation setup with PostgreSQL 16 and Valkey 8 (`.env.local.example`).
- **`dev`:** Development and CI automated test runner (`.env.dev.example`).
- **`hml`:** Staging / Homologation mirroring production security and topology (`.env.hml.example`).
- **`prd`:** Production with secrets injected via cloud vaults (`.env.prd.example`).

To set up local development:
```bash
cp .env.local.example .env
make docker-up
```

## 3. Setting Up Your Language Stack

Initialize your chosen stack in the repository root:

- **C# / .NET:** `dotnet new console` or `dotnet new webapi`
- **Java:** `mvn archetype:generate` or Gradle init
- **Rust:** `cargo init .`
- **Node.js / TypeScript:** `pnpm init` or `npm init -y`
- **Python:** `uv init .`
- **Go:** `go mod init <module-name>`

Once initialized, `make check` immediately uses your stack's native tooling.

## 4. Stack-Native Documentation Compilers

Documentation must adopt the best-in-class automatic documentation compiler native to the chosen stack:
- **C# / .NET:** DocFX or Doxygen (XML doc comments)
- **Java:** Javadoc or Dokka
- **Rust:** `cargo doc` (Rustdoc)
- **TypeScript / React / Node:** TypeDoc or Storybook
- **Go:** `pkgsite` or `godoc`
- **Python:** `mkdocs` with `mkdocstrings[python]`

Override `CMD_DOCS` and `CMD_DOCS_SERVE` in `stack.mk` as needed.

## 5. Customizing Commands with `stack.mk`

To override or customize commands, create an optional `stack.mk` file:

```makefile
CMD_DEV = pnpm run dev
CMD_LINT = pnpm run lint
CMD_TEST = pnpm test
CMD_DOCS = npx typedoc --out site/api src
```

## 6. UI Prototyping, Anti-Redundancy & Anti-Leakage Standard

For any UI work:
1. **Prior Visual Approval:** Generate an interactive visual prototype under `frontend/prototypes/<screen-slug>/` and get user approval before writing production code.
2. **Formal & Technical Portuguese:** All user-facing strings must use formal and technical Brazilian Portuguese (`pt-BR`).
3. **No Obvious Explanations:** Do not patronize users with obvious copy.
4. **Information Leakage Prevention:** Error banners and alerts must never expose backend implementation details, raw SQL errors, database schema names, internal formulas, or technical stack traces.
