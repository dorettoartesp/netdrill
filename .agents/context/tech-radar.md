# Tech Radar and Technology Guidelines (.agents/context/tech-radar.md)

Matrix of approved, evaluated, and prohibited technologies for this project.

## Core Universal Standards (Adopt)

| Category | Technology | Rationale |
|---|---|---|
| **Agent Governance** | Superpowers + Ponytail | Structured engineering methodology (TDD, systematic debugging, anti-overengineering). |
| **Command Token Saver** | RTK (`rtk`) | High-performance CLI proxy reducing LLM context window token consumption. |
| **Code Intelligence** | CodeGraph (`codegraph`) | Semantic symbol indexing and call path navigation. |
| **UI Prototyping** | OpenDesign | Prior visual screen approval and versioned prototypes (`prototypes/<screen-slug>/`). |
| **Secret Detection** | Gitleaks (`gitleaks`) | Pre-commit and historical scanning preventing leaked credentials. |
| **SAST Security** | Semgrep (`semgrep`) | Local offline static application security testing rules. |
| **Path Portability** | `check-portability.sh` | Automated verification preventing hardcoded local machine paths. |
| **Changelog & Commits** | Conventional Commits + `git-cliff` | Automated semantic commit standardization and changelog generation. |
| **Documentation** | MkDocs (Material) | Fast, searchable static engineering portal. |

## Application Stack Selection

*When initializing the application stack in the repository root, record the chosen technologies below:*

| Category | Technology | Status | Rationale |
|---|---|---|---|
| **Primary Language** | *[e.g. C# / Java / Rust / Node / Python / Go]* | Adopt | *[Decision rationale]* |
| **Framework** | *[e.g. ASP.NET / Spring Boot / Axum / Express / FastAPI]* | Adopt | *[Decision rationale]* |
| **Database / Persistence**| *[e.g. PostgreSQL / SQLite / DynamoDB]* | Adopt | *[Decision rationale]* |

## Language & Localization Standards

- All technical documentation, code, docstrings, tests, and commits must be in **English**.
- The end-user application interface must be localized in **Brazilian Portuguese (pt-BR)**.
