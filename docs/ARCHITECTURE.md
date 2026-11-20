# Architecture — NetDrill

## 1. System Overview
NetDrill is a responsive, web-based technical command and configuration drill platform designed to build muscle memory through spaced repetition (SuperMemo-2). The system targets Linux administration, computer networking, and FortiGate firewall configurations, while providing a domain-agnostic schema capable of accommodating any CLI or configuration syntax (e.g., Kubernetes, PostgreSQL).

## 2. Core Architectural Layers

```text
+-------------------------------------------------------------------------+
|                        Presentation Layer (Next.js)                     |
|  - App Router (/page, /login, /import)                                  |
|  - Terminal & Muscle Memory Drill Engine (Prompt, Mobile Accessory Bar) |
|  - Dual Theme Engine (Light & Dark WCAG AA Compliant)                   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                         Domain & Application Layer                      |
|  - Spaced Repetition Engine (calculateSM2)                              |
|  - Session Queue Builder (buildSessionQueue)                            |
|  - Line-by-Line Syntax Validator (compareBlock, normalizeLine)          |
|  - Bulk Ingestion Engine (importBulkData)                               |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                        Infrastructure & Persistence                     |
|  - Turso DB / libSQL Serverless Client (@libsql/client)                 |
|  - SQLite In-Memory / Local File Fallback (file:local.db)                |
|  - DDL Schema & Database Migrations (runMigrations)                     |
+-------------------------------------------------------------------------+
```

## 3. Background Job Anticipation (Architecture Invariant)
In accordance with `AGENTS.md` (Section 1.9), the system decouples synchronous HTTP requests from background processing:
- Heavy bulk imports (`/api/import`) and dataset re-indexing process records in decoupled batch chunks.
- As the user base expands, spaced repetition queue pre-calculations and historical analytics are scheduled via background worker routines without blocking user interaction threads.

## 4. Multi-Tier Environment Strategy
- **`local`:** Uses local SQLite file (`file:local.db`) or local in-memory database with zero external dependencies.
- **`dev`:** CI/CD pipeline automated verification with `make check`, Semgrep, and Gitleaks.
- **`hml`:** Staging environment mirroring production on Vercel preview branches.
- **`prd`:** Production hosted on Vercel connected to Turso Cloud libSQL distributed database with secrets injected via environment variables.
