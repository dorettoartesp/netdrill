# NetDrill

A universal, stack-agnostic software development template engineered specifically for autonomous LLM coding agents and human engineering teams.

## Overview

`netdrill` provides a clean, open root canvas ready to receive any programming language runtime or framework (C#/.NET, Java, Rust, Node/TypeScript, Python, Go, etc.) while pre-configuring a battle-tested AI agent engineering ecosystem:

- **Adaptive Execution Facade (`Makefile`):** Automatically dispatches `test`, `lint`, and `dev` targets based on detected language manifests (`*.csproj`, `pom.xml`, `build.gradle`, `Cargo.toml`, `package.json`, `pyproject.toml`, `go.mod`), with support for explicit overrides via `stack.mk`.
- **Integrated AI Skills Kit (`.agents/skills/`):** Full suite of 24 versioned agent capabilities including Superpowers (TDD, systematic debugging, plan execution, parallel agents), Ponytail (anti-overengineering), RTK (command output compression), and OpenDesign (prior visual screen approvals).
- **Local Infrastructure Baseline (`docker-compose.yml`):** Ready-to-use local backing services with **PostgreSQL 16** and **Valkey 8** (open-source Redis alternative) with healthchecks and persistent storage (`make docker-up`).
- **Four-Tier 12-Factor Environment Architecture:** Complete templates for `local`, `dev`, `hml`, and `prd` (`.env.*.example`) with stack hints.
- **The Inviolable Quality Gate (`make check`):** Enforces static security analysis (Semgrep), credential leak detection (Gitleaks), local filesystem portability, and conventional commits.
- **Structured Knowledge Management (`docs/`):** Living documentation portal (MkDocs Material) with pre-configured directories for Architecture Decision Records (`docs/adr/`), Product & Engineering Backlog (`docs/backlog/`), Operations & SRE (`docs/runbooks/`), and API Contracts (`docs/api/`).
- **Project Bootstrap Wizard (`make new-project`):** Rapid rebranding, metadata replacement, and Git history reinitialization with automated sandbox testing (`make test-bootstrap`).

## Quickstart

```bash
# 1. View available Makefile targets
make help

# 2. Run the quality gate (clean exit 0 on uninitialized canvas)
make check

# 3. Initialize your chosen language or framework directly in the root
cargo init .      # for Rust
dotnet new web    # for C#
npm init -y       # for Node.js
uv init .         # for Python
go mod init app   # for Go

# 4. make check automatically adapts and tests your stack!
make check

# 5. Build living documentation
make docs
```

## Adaptive Multi-Stack Detection

| Stack | Detected Files | `make test` | `make lint` | `make dev` |
|---|---|---|---|---|
| **C# / .NET** | `*.csproj`, `*.sln` | `dotnet test` | `dotnet format --verify-no-changes` | `dotnet run` |
| **Java (Maven)** | `pom.xml` | `mvn test` | `mvn checkstyle:check` | `mvn spring-boot:run` |
| **Java (Gradle)** | `build.gradle*` | `./gradlew test` | `./gradlew check` | `./gradlew bootRun` |
| **Rust** | `Cargo.toml` | `cargo test` | `cargo clippy` | `cargo run` |
| **Node.js** | `package.json` | `npm test` | `npm run lint` | `npm run dev` |
| **Python** | `pyproject.toml` | `pytest` | `ruff check .` | `python -m app` |
| **Go** | `go.mod` | `go test ./...` | `golangci-lint run` | `go run .` |
| **Custom** | `stack.mk` | `$(CMD_TEST)` | `$(CMD_LINT)` | `$(CMD_DEV)` |

## Repository Structure

```text
.
├── .agents/                    # Agent ecosystem: memory, context, skills, workflows
├── .codegraph/                 # Semantic code intelligence
├── .dockerignore               # Universal container build exclusion rules
├── .editorconfig               # Universal formatting
├── .env.example                # 12-Factor environment templates (.local, .dev, .hml, .prd)
├── .gitattributes              # Binary and line-ending controls
├── .github/                    # GitHub community issue and PR templates
├── .gitignore                  # Universal git ignore
├── .pre-commit-config.yaml     # Gitleaks, portability, and format hooks
├── .semgrep/                   # Project SAST rules
├── AGENTS.md                   # Inviolable agent engineering and quality rules
├── CHANGELOG.md                # Automated release notes from Conventional Commits
├── cliff.toml                  # Git-cliff changelog generator configuration
├── CONTRIBUTING.md             # Contributor workflows and commit conventions
├── docker-compose.yml          # Local backing services (PostgreSQL 16 + Valkey 8)
├── docs/                       # Living engineering documentation
│   ├── adr/                    # Architecture Decision Records (MADR format)
│   ├── api/                    # API contracts and specifications
│   ├── backlog/                # Backlog management, roadmap, and task matrix
│   └── runbooks/               # Operational guides and SRE runbooks
├── LICENSE                     # License specification
├── Makefile                    # Universal adaptive lifecycle facade
├── mkdocs.yml                  # MkDocs Material configuration
├── README.md                   # Project overview
├── scripts/                    # Automated tooling (bootstrap, portability, security)
├── SECURITY.md                 # Security and vulnerability disclosure policy
└── skills-lock.json            # Pinned skills manifest
```

## License

Apache 2.0
