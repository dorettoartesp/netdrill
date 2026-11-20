# Architecture Decision Records (ADR)

This directory maintains the chronological log of significant architectural, technical, and structural decisions made for this repository.

## 1. What is an ADR?
An Architecture Decision Record (ADR) captures an important architectural decision made along with its context, considered options, decision drivers, and consequences.

## 2. Decision Lifecycle
Each ADR maintains a lifecycle status:
- **PROPOSED:** Under review and team evaluation.
- **ACCEPTED:** Formally approved and binding.
- **REJECTED:** Evaluated but not adopted.
- **DEPRECATED:** No longer applicable.
- **SUPERSEDED:** Replaced by a newer record (links to successor ADR).

## 3. Creating a New ADR
1. Copy `docs/adr/template.md` to `docs/adr/NNNN-<kebab-case-title>.md` (e.g., `0002-adopt-postgresql-and-valkey.md`).
2. Fill out all sections with concrete technical context.
3. Submit via pull request for review.
