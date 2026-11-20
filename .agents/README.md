# AI Agent Development Directory (.agents/)

This directory standardizes the operating ecosystem for autonomous AI agents and human collaborators in this repository, following open agentic development standards.

## Directory Structure

```text
.agents/
├── memory/            # Persistent memory, architectural decisions, and durable facts
├── context/           # Business domain models, technical radars, and system context
├── skills/            # Specialized procedural skills and guidelines
└── workflows/         # Execution playbooks for common agent tasks
```

## Agent Operating Principles

1. **Context Before Action:** Always inspect `AGENTS.md`, `memory/decisions.md`, and relevant specifications in `docs/` before suggesting or implementing changes.
2. **Unbreakable TDD Cycle:** Implementing agents must demonstrate a test failure before writing production code (*Red-Green-Refactor*).
3. **Immutability of Decisions:** Decisions registered in `memory/decisions.md` must never be altered or reverted without explicit operator consent.
4. **Strict Quality Gate Verification:** No agent may finalize a task without proving that `make check` exits cleanly with code 0.
5. **Language & Localization Rule:**
   - All code, comments, docstrings, tests, and documentation must be in **English**.
   - End-user application UI strings must be in **Brazilian Portuguese (pt-BR)**.
