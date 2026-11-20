---
name: tdd-workflow
description: Strict Test-Driven Development (TDD) execution guide for AI agents across backend and frontend
---

# Skill: TDD Cycle (Test-Driven Development)

## Fundamental Rule
No production code shall be written without a corresponding automated test created and failing beforehand (*Red-Green-Refactor*).

## Cycle Steps

1. **RED (Write Failing Test):**
   - Identify the expected feature behavior or bug fix requirement.
   - Author the test in the appropriate layer (`unit/`, `integration/`, or `e2e/`).
   - Run the test and confirm it fails for the expected reason (not an unrelated syntax error).

2. **GREEN (Minimal Code to Pass):**
   - Write the minimal implementation required to satisfy test assertions.
   - Run the parallel test suite (`make test`) and verify all tests pass.

3. **REFACTOR (Clean Code & Quality):**
   - Refactor code applying SOLID, DRY, and eliminating duplication.
   - Ensure the test suite stays 100% green after every refactoring step.
   - Ensure coverage remains preferably at 100% (non-negotiable floor >= 90%).
   - All code, docstrings, and comments must be in **English**.
