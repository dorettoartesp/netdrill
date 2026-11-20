# Decisions Log (.agents/memory/decisions.md)

Chronological record of technical, architectural, and governance decisions agreed with the operator for `agentic-tmpl`.

## 2026-11-20
- **Open-Canvas Monorepo Architecture:** The repository adopts an open root canvas with no hardcoded language dependencies or rigid `backend/` and `frontend/` folders, ready to receive any programming language or framework directly.
- **Adaptive Makefile Facade:** Root `Makefile` automatically detects active project manifests (`*.csproj`/`*.sln` for C#, `pom.xml`/`build.gradle` for Java, `Cargo.toml` for Rust, `package.json` for Node, `pyproject.toml` for Python, `go.mod` for Go) and dispatches lifecycle targets (`test`, `lint`, `dev`), with explicit override support via `stack.mk`.
- **Graceful Zero-Stack Baseline:** On an uninitialized canvas, `make check` passes cleanly with exit code 0, executing security, portability, formatting, and SAST scans while reporting testing/linting pending stack setup.
- **Mandatory TDD Across All Stacks:** Strict Test-Driven Development (*Red-Green-Refactor*) is mandatory for any feature or bug fix regardless of language choice.
- **Anti-Overengineering & Ponytail Mindset:** Contributors and AI agents must follow the Ponytail ladder: YAGNI first, reuse existing codebase utilities, prefer standard library and native platform primitives, minimizing code size while strictly preserving invariants in security, accessibility, and testing.
- **Mandatory Prior Visual Screen Approval & OpenDesign Protocol:** Every UI screen or major interaction must be approved beforehand via a viewable artifact before production code is written. Prototypes must be committed and versioned in Git under `prototypes/<screen-slug>/`.
- **Automated Portability Gate:** Mandatory verification via `scripts/check-portability.sh` (enforced in `make check` and pre-commit) blocking hardcoded absolute machine paths (`/home/`, `/Users/`, `file:///...`), guaranteeing repository portability and protecting developer host paths.
- **Defense-in-Depth Security:** Gitleaks active for credential scanning in history and staged commits; Semgrep active for static security analysis (SAST) with offline rules in `.semgrep/rules.yml`.
- **Universal Bootstrap Wizard:** Rebranding, slug replacement, and clean Git history reset automated via `scripts/init-project.sh` (`make new-project`) and verified in sandbox via `scripts/test-init-project.sh` (`make test-bootstrap`).
- **AI Agent Tooling:** Pinned and versioned 24 skills in `.agents/skills/` (Superpowers, Ponytail, RTK, OpenDesign, CodeGraph), tracked via `skills-lock.json`.
- **Living Documentation:** Automated documentation portal configured via `mkdocs.yml` (Material) and conventional commits changelog via `git-cliff` (`cliff.toml`).
- **Language Governance:** Codebase, docstrings, tests, and repository documentation strictly in English. User-facing application interface strings localized in Brazilian Portuguese (`pt-BR`).
