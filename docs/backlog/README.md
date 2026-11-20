# Product & Engineering Backlog Management

This section provides governance for managing requirements, user stories, epics, and engineering tasks for human contributors and automated AI agents.

## 1. Principles of Agile Specification
- **Definition of Ready (DoR):** A task or story is ready for implementation only when it has clear acceptance criteria, defined non-goals, security considerations, and UI prototype approval (if modifying user interfaces).
- **Definition of Done (DoD):** A task is completed only when:
  1. Production code is backed by automated tests (coverage floor >= 90%).
  2. The quality gate `make check` passes with exit code 0.
  3. No secrets or machine-specific paths are committed.
  4. Documentation is updated.

## 2. Directory Structure
- `docs/backlog/roadmap.md`: Strategic vision, quarters/milestones, and high-level deliverables.
- `docs/backlog/items.md`: Structured backlog tracking table.
