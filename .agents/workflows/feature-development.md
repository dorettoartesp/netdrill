# Playbook: New Feature Development (.agents/workflows/feature-development.md)

Recommended workflow for agents implementing new features in this repository.

## Steps

1. **Understanding and Specification:**
   - Review architectural decisions in `.agents/memory/decisions.md`.
   - Consult or author the technical specification in `docs/superpowers/specs/` in English.
   - Determine whether domain modeling (DDD) or application services are required.

2. **Task Planning (TDD):**
   - Decompose implementation into independently testable steps.
   - Follow the RED -> GREEN -> REFACTOR cycle at each phase.

3. **Continuous Verification:**
   - Execute parallel test suites frequently during development (`make test`).
   - Maintain code coverage preferably at 100% (non-negotiable floor >= 90%).

4. **Completion and Quality Gate:**
   - Run `make check` and confirm zero errors across tests, linters, and security scanners.
   - Keep API contract in `docs/API.md` and automated docs synchronized.
   - Update `CHANGELOG.md` via `make changelog`.
   - Format commit using Conventional Commits (`feat: <message in English>`).
