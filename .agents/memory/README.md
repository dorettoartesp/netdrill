# Persistent Memory Directory (.agents/memory/)

Stores the durable history of engineering decisions, operator design choices, and architectural constraints persisting across agent sessions.

## Files

- **[decisions.md](decisions.md):** Chronological log of technical decisions and operator instructions.
- Additional thematic memory logs can be added as domain complexity expands.

## Rules for Agents

- **Read:** Consult `decisions.md` at the start of every task.
- **Write:** When the operator establishes an architectural decision or long-term constraint, record it as a dated entry (`YYYY-MM-DD: <decision> - <justification>`).
