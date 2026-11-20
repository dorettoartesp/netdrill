# ADR 0005: Zero-Touch Automated Deployment via CLI Tools

## Status
Accepted

## Context
The operator explicitly requested zero manual deployment overhead: the AI agent must handle database creation, token provisioning, GitHub repository creation, and Vercel hosting deployment entirely through command-line tools without requiring the user to navigate web consoles.

## Decision
Automate infrastructure lifecycle using official CLI utilities:
- **Turso CLI:** Automated database creation (`turso db create`) and token generation (`turso db tokens create`).
- **GitHub CLI (`gh`):** Remote repository creation (`gh repo create`) and branch synchronization.
- **Vercel CLI (`vercel`):** Project linkage, environment variable injection, and production deployment (`vercel --prod`).

## Consequences
- **Positive:** Complete elimination of manual deployment tasks for the user; deterministic, repeatable deployment flow.
- **Negative:** Requires CLI tools and API keys to be available in the local execution environment.
