# [ADR-0006] Command-Centric Content Stored as Validated Documents

- **Status:** ACCEPTED
- **Date:** 2026-11-20
- **Deciders:** Doretto
- **Consulted:** Claude (design and implementation)

## Context and Problem Statement
Drill content lived in `topics → modules → items` rows with free-text `use_cases`/`output_notes`, while manual pages came from bundled JSON and an AI generator (OpenRouter/Nemotron) cached in `man_pages`. The two never referenced each other, re-importing duplicated items (random IDs), and the AI path added cost and uncurated content. The owner now authors all content offline with any LLM and uploads JSON packs through `/import`, organized around commands (flags, examples, use cases) and multi-step procedures.

## Decision Drivers
- One source of truth for the manual and the drills.
- Idempotent re-upload of corrected packs without losing spaced-repetition progress.
- Format that evolves quickly as the owner refines the authoring prompt.
- No runtime AI dependency.

## Considered Options
1. **Validated documents + drill index:** each command/procedure stored whole as validated JSON (`documents.body`); small tables for topics, drills, progress and links.
2. **Fully relational:** separate tables for commands, flags, examples, use cases, procedures and steps.
3. **Extend the item-based schema.**

## Decision Outcome
Chosen option: **Option 1**, because the content is authored and read as documents; only drills, progress, topics and cross-references need relational queries. A single Zod 4 schema validates uploads, types the code and generates the JSON Schema embedded in the authoring prompt.

### Positive Consequences
- New optional fields need no database migration.
- What is uploaded is exactly what is stored and displayed.
- Stable IDs make uploads idempotent.

### Negative Consequences / Trade-offs
- Searching inside flags or examples requires reading documents (acceptable at single-user scale).
- Schema v2 replaces every legacy table: the first deploy discards existing content and progress (accepted by the owner).
- Cascading deletes are performed explicitly by the importer because foreign-key enforcement is not guaranteed per request on Turso over HTTP.

## Pros and Cons of Options

### Option 2
- Good, because any query is possible in SQL.
- Bad, because every JSON field change needs a migration and mapping code (~8 tables).

### Option 3
- Good, because the smallest change.
- Bad, because it keeps content exercise-centric, duplicated across manual and drills, and non-idempotent.
