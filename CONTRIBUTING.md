# Contributor Guidelines

Guidelines for contributors, maintainers, and automated AI coding agents.

## Core Development Principles
1. **English in Code and Docs:**
   - Commit messages, documentation, code comments, and test descriptions must strictly be authored in English.
2. **Portuguese in Application UI:**
   - User-facing text, notifications, and form controls must be in Brazilian Portuguese (pt-BR) using a formal, technical register.
   - Avoid colloquial phrasing, patronizing explanations of obvious actions, or exposing internal business logic and technical errors.
3. **Conventional Commits:**
   - Follow standard commit prefixes: `feat:`, `fix:`, `docs:`, `build:`, `chore:`, `refactor:`, `test:`, `perf:`.
4. **Mandatory Quality Gate:**
   - All contributions must pass `make check` with exit code 0 prior to review or merge.
5. **UI Screen Prototyping:**
   - Screen modifications or additions require prior visual review and approval using an interactive prototype before production implementation begins.
