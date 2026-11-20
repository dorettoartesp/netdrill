# Architecture: Universal Stack-Agnostic Agentic Template (`netdrill`)

## 1. Overview

`netdrill` is designed to be an open-canvas monorepo. It imposes zero constraints on the programming language, framework, or directory structure of the underlying software application, while providing a complete, hardened AI agent governance and quality framework.

## 2. Core Architectural Pillars

```text
                        ┌────────────────────────────────┐
                        │      netdrill Monorepo     │
                        └───────────────┬────────────────┘
                                        │
                ┌───────────────────────┴───────────────────────┐
                ▼                                               ▼
     ┌────────────────────────────┐               ┌────────────────────────────┐
     │  Agent Ecosystem (.agents) │               │   Adaptive Makefile Facade │
     │  - Superpowers             │               │   - C# (.NET)              │
     │  - Ponytail (Anti-Bloat)   │               │   - Java (Maven/Gradle)    │
     │  - RTK Token Compression   │               │   - Rust (Cargo)           │
     │  - OpenDesign Prototypes   │               │   - Node.js (npm/pnpm)     │
     │  - CodeGraph Intelligence  │               │   - Python (uv/pytest)     │
     └────────────────────────────┘               │   - Go                     │
                                                  │   - Custom (stack.mk)      │
                                                  └─────────────┬──────────────┘
                                                                ▼
                                                  ┌────────────────────────────┐
                                                  │ Pluggable Application Root │
                                                  │ (Any stack / open canvas)  │
                                                  └────────────────────────────┘
```

### 2.1. The Open Root Canvas
Unlike traditional templates that enforce rigid directory structures like `backend/` and `frontend/`, `netdrill` keeps the root open. Developers or CLI initializers (`cargo new`, `dotnet new`, `npm init`, `uv init`, `go mod init`) can establish single-service, library, CLI, or microservice layouts directly in the workspace.

### 2.2. The Adaptive Makefile Contract
The root `Makefile` operates as an intelligent facade. It inspects the root filesystem for known language manifest files and dispatches canonical lifecycle targets (`test`, `lint`, `dev`) automatically:

1. **Explicit Override (`stack.mk`):** If `stack.mk` is present, variables `CMD_TEST`, `CMD_LINT`, and `CMD_DEV` take precedence over all automatic detection.
2. **Auto-Detection:**
   - C# / .NET: `*.csproj`, `*.sln`
   - Java Maven: `pom.xml`
   - Java Gradle: `build.gradle`, `build.gradle.kts`
   - Rust: `Cargo.toml`
   - Node.js: `package.json`
   - Python: `pyproject.toml`
   - Go: `go.mod`
3. **Graceful Zero-Stack Baseline:** When no language manifest is detected, `test` and `lint` print an informative status and exit with code 0.

### 2.3. Backing Services & Background Jobs Standard
Local developer infrastructure is orchestrated via Docker Compose (`docker-compose.yml`):
- **PostgreSQL 16:** Relational persistence with healthchecks and persistent named volume.
- **Valkey 8:** High-performance open-source cache and task broker with healthchecks.
- **Background Jobs:** Architecture mandates anticipation of asynchronous background workers from day one. Slow I/O and external communications must not block synchronous HTTP request threads.

### 2.4. Architecture Decisions & Knowledge Management
- Architectural decisions are logged in `docs/adr/` using the MADR standard.
- Product and engineering backlogs are tracked under `docs/backlog/`.
- SRE and deployment procedures are maintained in `docs/runbooks/`.
- API contracts are versioned in `docs/api/`.

### 2.5. The Inviolable Quality Gate (`make check`)
The `make check` target is the central entry barrier. It aggregates:
- `lint`: Language linter or pending notice.
- `semgrep`: Static application security analysis.
- `test`: Automated test suite execution.
- `scan`: Credential detection via Gitleaks.
- `portability`: Automated hardcoded local path blocker.
- `git diff --check`: Patch whitespace sanity.
