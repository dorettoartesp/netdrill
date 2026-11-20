# AGENTS.md

Mandatory rules and engineering guidelines for human contributors and automated AI agents working in this repository.

## 1. General Guidelines and Governance
- **Preserve Structure and Standards:** This repository provides an open, stack-agnostic canvas powered by disciplined AI agent governance. Core agent tooling (`.agents/`), documentation (`docs/`), and scripts (`scripts/`) must remain clean and well-structured.
- **Mandatory Prior Consultation:** Before making modifications, inspect specifications under `docs/superpowers/specs/`, current plans in `docs/superpowers/plans/`, and architectural decisions logged in `.agents/memory/decisions.md`.
- **Continuous Documentation Maintenance (`docs/`):** Any evolution in architecture, environment, workflows, or conventions must be immediately reflected in files under `docs/` (`docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/SECURITY_PRACTICES.md`).
- **Living API & Architecture Contracts:** If the project exposes an API or service, API contracts and OpenAPI/JSON schemas must be maintained under `docs/` (`docs/api/`).
- **Architecture Decision Records (ADRs):** Significant architectural changes, technology selections, or structural refactorings must be documented in `docs/adr/` using the standard MADR format.
- **Stack-Native Automatic Documentation Standards (Do Not Fix on MkDocs):** Documentation generation must never be permanently locked to MkDocs. When a language stack is initialized, the project must adopt the best-in-class automatic documentation compiler native to that ecosystem:
  - **C# / .NET:** DocFX or Doxygen (compiling XML doc comments).
  - **Java:** Javadoc or Dokka.
  - **Rust:** `cargo doc` (Rustdoc).
  - **TypeScript / React / Node:** TypeDoc or Storybook.
  - **Go:** `pkgsite` or `godoc`.
  - **Python:** `mkdocs` with `mkdocstrings[python]`.
  - In `Makefile`, `make docs` and `make docs-serve` are stack-adaptive (`CMD_DOCS`), defaulting to MkDocs for the open canvas state.
- **Mandatory Complete Docstrings in English (Always):** All source code must contain complete docstrings (language-standard format, e.g., XML doc comments for C#, Javadoc for Java, Rustdoc for Rust, TSDoc for TypeScript, Google docstrings for Python).
- **Strict Preference for Open-Source Tools:** AI agents and human contributors must always give strict priority to proven, community-governed open-source tools, runtimes, databases, and dependencies over proprietary or restrictively licensed alternatives (e.g., Valkey over proprietary Redis, PostgreSQL over commercial engines).
- **Mandatory Background Job Anticipation (Architecture Invariant):** All application architectures must assume background jobs will exist from day one:
  - Long-running operations, bulk data transformations, report generation, external API calls, and email notifications must never run synchronously on HTTP request threads or inside open database transactions.
  - Architecture must cleanly decouple synchronous Web APIs from asynchronous background workers, keeping worker processes stateless and queue-driven.
- **Docker, Docker Compose & Containerization Baseline:**
  - Docker Compose is the canonical platform for local backing dependencies (PostgreSQL 16, Valkey 8 via `make docker-up`).
  - Multi-stage builds (`Dockerfile`) must cleanly segregate local development from hardened production images.
- **Four-Environment Architecture (`local`, `dev`, `hml`, `prd`):**
  - Architecture and configurations must support four distinct environments: `local` (workstation), `dev` (CI/CD pipeline), `hml` (staging mirroring production), and `prd` (production with secrets injected via cloud vaults).
  - Declarative templates must be maintained: `.env.local.example`, `.env.dev.example`, `.env.hml.example`, `.env.prd.example`, and `.env.example`.
- **Language and Localization Governance:**
  - **Source Code, Comments, Docstrings, Tests, and Commit Messages:** Strictly in **English**.
  - **All Repository Documentation:** (`AGENTS.md`, `CONTRIBUTING.md`, `README.md`, `SECURITY.md`, `docs/*`, `.agents/*`) strictly in **English**.
  - **Application User Interface (UI):** User-facing strings, buttons, form labels, notifications, error banners, and UI internationalization strictly in **Brazilian Portuguese (pt-BR)** using **formal and technical register**.
- **Commits:** Conventional Commits are mandatory (`feat:`, `fix:`, `docs:`, `build:`, `chore:`, `refactor:`, `test:`, `perf:`).
- **The Inviolable Quality Gate (`make check`):** The command `make check` must be executed and pass with exit code 0 before any commit is finalized.
- **Cross-Platform Portability:** Zero hardcoded local machine paths (`/home/`, `/Users/`, `file:///...`) are permitted in tracked files, enforced automatically by `scripts/check-portability.sh`.

## 2. Core Development Methodology

### 2.1. Mandatory Test-Driven Development (TDD)
- **Iron Law:** No production code shall be written without a prior failing automated test proving the requirement (*Red-Green-Refactor*).
- **Comprehensive Test Layers:**
  - `unit`: Pure, fast, isolated unit tests (no external I/O or tightly coupled dependencies).
  - `integration`: Integration tests validating interactions between components, configurations, database, and services.
  - `e2e`: End-to-end tests validating full cycles of requests, responses, schemas, and user flows.
- **Coverage Targets:** Prefer **100%** code coverage. When justified as prohibitive, coverage must strictly remain **>= 90%**.

### 2.2. Architecture, DDD, and Software Principles
- **Domain-Driven Design (DDD):** When modeling cost is justified by business complexity:
  - Isolate pure business logic in domain entities and Value Objects independent of persistence frameworks or UI.
  - Encapsulate complex flows in domain services and decouple infrastructure adapters from the application layer.
- **SOLID & Clean Code:**
  - **S**ingle Responsibility: each module, class, or function must have a single reason to change.
  - **O**pen/Closed: open for extension, closed for modification.
  - **L**iskov Substitution: subtypes must be substitutable for their base types without altering correctness.
  - **I**nterface Segregation: lean, targeted interfaces tailored to what consumers actually need.
  - **D**ependency Inversion: depend on abstractions/protocols, never on concrete implementations in core domain logic.
- **DRY & YAGNI:** Avoid inadvertent code duplication (*Don't Repeat Yourself*), avoiding premature abstractions or speculative features (*You Aren't Gonna Need It*).
- **Anti-Overengineering Standard (Ponytail Mindset):**
  - AI agents and human contributors must strictly avoid over-engineering, premature generalizations, and bloated architectures.
  - Follow the Ponytail decision ladder for every implementation:
    1. **Necessity (YAGNI):** If a feature, helper, or abstraction is not directly required by the immediate task or spec, do not build it.
    2. **Reuse Existing Assets:** Thoroughly inspect existing code, helpers, and utilities before creating new ones.
    3. **Standard Library & Native Platform First:** Prefer language standard libraries and native platform capabilities over heavy third-party packages.
    4. **Minimal Idiomatic Change:** The best solution is the smallest, cleanest idiomatic change that fully satisfies the requirement, passes all tests, and is easy to comprehend in one reading.
    5. **Protected Invariants:** Minimalism never compromises security, error handling, test coverage, operational logging, accessibility (a11y), or transaction safety.

## 3. UI, Prototyping, and OpenDesign Protocol

### 3.1. Mandatory Prior Screen Approval Gate
- Under no circumstances shall production UI code or view templates be written for any new screen, page, modal flow, or major UI overhaul without prior visual approval from the user/product owner based on a viewable artifact.

### 3.2. Viewable Artifact Requirement
- The prototype presented for approval must be an interactive or visualizable artifact displaying concrete layout, typography, real contextual copy (in pt-BR), responsive behavior, and theme support.

### 3.3. Tooling Hierarchy (Native Tools vs. OpenDesign)
- **Native Design Tools (Priority):** If the running AI agent harness provides native design or artifact preview capabilities (e.g., Antigravity visual artifacts, Claude HTML artifacts, v0 rendering), the agent **MUST** prioritize and utilize them to render and preview the artifact directly for the user.
- **OpenDesign Skill (Standard & Fallback):** If native visual tools are unavailable, or for browser-based offline review, the agent **MUST** invoke the [`open-design`](.agents/skills/open-design/SKILL.md) skill versioned in `.agents/skills/open-design/`.

### 3.4. Mandatory Versioning of All Screen Prototypes
- All visual artifacts, wireframes, and prototypes must be committed and versioned in Git under `prototypes/<screen-slug>/`.
- Canonical structure:
  - `prototypes/<screen-slug>/index.html`: Runnable, self-contained interactive prototype adhering to three-screen breakpoints (Desktop, Tablet, Mobile) and pt-BR localization.
  - `prototypes/<screen-slug>/README.md`: Screen metadata, route path, user stories, responsive breakdown, state matrix (default, hover, focus, loading, empty, error), and explicit approval audit log (`Status: APPROVED`, `Approved by:`, `Date:`).

### 3.5. Responsive Design, Accessibility (a11y), and Themes
- **Three-Screen Responsive Layouts:** Desktop (>= 1024px), Tablet (768px - 1023px), and Mobile (< 768px). Touch targets minimum 44x44px.
- **Web Accessibility (WCAG 2.1/2.2 AA):** Semantic markup, logical keyboard navigation, distinct focus rings (`focus-visible`), and compliant contrast ratios (4.5:1).
- **Dual Themes:** Always maintain complete Light and Dark theme support.
- **Disable on Action:** Any button triggering async requests or form submissions must disable immediately (`disabled = true`) with visual feedback to prevent duplicate submissions.

### 3.6. UI Microcopy, Anti-Redundancy, and Information Leakage Prevention
- **Formal and Technical Portuguese Register:** All user-facing UI text, buttons, alerts, form labels, and feedback messages must strictly use **formal and technical Brazilian Portuguese (pt-BR)**. Prohibit colloquialisms, playful slang, diminutive expressions ("cliquezinho"), or overly informal conversational AI fillers.
- **Anti-Redundancy (Do Not State the Obvious):** UI text, helper copy, and labels must never patronize users with obvious explanations (e.g., "Clique aqui para clicar", "Esta tabela lista registros", "Preencha o campo nome com seu nome"). Microcopy must be purposeful, concise, and respectful.
- **Information Leakage Prevention (Never Expose Business Rules or Internals):** Error banners, notifications, and tooltips must NEVER expose backend implementation details, raw SQL errors, stack traces, database schema names, internal formula thresholds, or confidential business rules. Feedback must be actionable, dignified, and user-focused in technical pt-BR (e.g., "Não foi possível concluir a operação. Verifique os parâmetros informados e tente novamente.").

## 4. Security and Secrets Management
- **Zero Secrets in Version Control:** Never commit `.secrets/`, `.data/`, `.env` files, credentials, or cryptographic keys.
- **Prohibited in Logs and Exceptions:** Never expose passwords, API keys, access tokens, or sensitive user data in logs, error traces, or tests.
- **Automated Verification:**
  - `gitleaks`: Mandatory local staged scan (via pre-commit) and historical audit (`make scan`).
  - `semgrep`: Project SAST rules in `.semgrep/rules.yml` must pass with 0 violations (`make semgrep`).
  - `portability`: Mandatory zero hardcoded local filesystem paths (`scripts/check-portability.sh`, enforced in `make check` and pre-commit) to guarantee cross-machine portability and prevent leaking host paths (`/home/`, `/Users/`, `file:///...`).

## 5. AI Agents and Automation
- AI development artifacts and specialized capabilities are centralized under `.agents/`.
- Durable facts, operational constraints, and architectural decisions must be recorded in `.agents/memory/decisions.md`.
- **RTK (Rust Token Killer) Token Compression:**
  - RTK (`rtk`) is installed as a high-performance CLI proxy to intercept and compress verbose command outputs, saving LLM context window tokens.
- **CodeGraph Semantic Code Intelligence:**
  - Monorepo structure, symbols, imports, and call graphs are pre-indexed into `.codegraph/codegraph.db`.
  - Agents must query CodeGraph symbols and relationships via MCP (`codegraph_explore`, `codegraph_node`) or shell (`codegraph explore "<query>"`) before initiating broad grep loops.
- **Ponytail Anti-Overengineering Governance:**
  - AI agents must continuously apply Ponytail principles across all development tasks.
- **Superpowers Skill Kit Protocol:**
  - The repository versions the full Superpowers skill kit under `.agents/skills/` (TDD, systematic debugging, plan execution, verification, git worktrees, parallel agents). Agents must invoke applicable skills before taking ad-hoc actions.
- **OpenDesign & Visual Prototyping Governance:**
  - The repository versions the OpenDesign skill under [`.agents/skills/open-design/`](.agents/skills/open-design/SKILL.md) and enforces mandatory prior visual approval for any UI work.
