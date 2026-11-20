# Design: Command-Centric Content Packs (JSON Upload, No AI)

- **Date:** 2026-11-20
- **Status:** Draft for approval
- **Authors:** Doretto (product owner), Claude (design)

## 1. Intent and Why

NetDrill today stores two disconnected kinds of content: drill items (`topics → modules → items`, one exercise per row, free-text `use_cases`/`output_notes`) and manual pages (12 hand-written JSON files plus pages generated on demand by an OpenRouter/Nemotron model and cached in `man_pages`). A drill for `ss -tulpn` knows nothing about the `ss` manual, and the AI path adds cost, an external dependency and content the owner did not curate.

The owner wants to:

1. **Remove every AI feature** from the application.
2. **Author all content offline** with any LLM, as JSON, and **upload it through the web UI** (`/import`), including from a phone.
3. Store knowledge **organized around commands**: synopsis, flags, examples, explanation, use cases, real-world applications.
4. **Train everything**, not only single commands: multi-command investigations (e.g. cgroup OOM triage), reproduction recipes (e.g. stopping/continuing a process to observe state `T`), and vendor configuration blocks (e.g. FortiGate `config system interface … end`).
5. Copy a **ready-made LLM prompt** from the import screen so any LLM produces valid files.

## 2. Goals, Non-Goals, Anti-Goals

### Goals
- Two content kinds in one upload format (a **pack**):
  - **Command**: the reference record for one command (it is what the manual shows).
  - **Procedure**: an ordered, multi-step practical task built from commands or configuration blocks.
- Every command example and every procedure becomes a **drill** with spaced repetition (SM-2), blind test, use cases and annotated output, as today.
- **Idempotent upload**: stable IDs written in the JSON; re-uploading a corrected file updates in place and keeps progress.
- **Strict validation** before any write, with precise, field-level error messages; nothing is written if anything is invalid.
- **Whole UI in English**: every existing screen (login, topic selector, study session, manual, import, error banners) is translated, keeping the formal and technical register and the anti-leakage rules of AGENTS.md §3.6.
- **Copyable prompt** in `/import` that embeds the generated JSON Schema, authoring rules and a compact example.
- Manual (`/man`, `/man/[cmd]`, man modal) reads the same command records; a command page lists the procedures that use it.

### Non-Goals
- No migration of existing content or progress (owner regenerates everything).
- No in-app content editor; JSON is authored outside the app.
- No repository-versioned content folder or seed-at-deploy flow (owner chose upload).
- No external manual lookups or fallbacks beyond the existing external man7 link.

### Anti-Goals
- Any runtime call to an AI/LLM service.
- Uploads that silently duplicate drills or silently drop invalid entries (today's importer skips invalid items without telling the user).
- Error messages exposing SQL, stack traces or internal table names (AGENTS.md §3.6).

## 3. Constraints
- Next.js 14 App Router on Vercel, Turso/libSQL (SQLite dialect), single-user PIN auth (middleware already protects `/api/import`).
- TDD, ≥ 90% coverage on `src/lib`, `make check` gate. **Everything in English**: code, docs, UI copy and uploaded content (owner decision, supersedes the pt-BR UI rule in AGENTS.md §1/§3.6; AGENTS.md and decisions.md are updated accordingly).
- UI changes require an approved prototype under `prototypes/<slug>/` before production UI code (AGENTS.md §3).
- Background-job invariant (AGENTS.md §1): upload stays synchronous because it is bounded (body ≤ 2 MB, one transaction, sub-second on Turso); anything heavier must move to a job.

## 4. Approaches Considered

1. **Validated document + drill index (chosen).** Each command and procedure is stored whole as validated JSON; small relational tables hold only what is queried: topics, drills (with SM-2 progress) and procedure→command links. The format evolves by changing the schema, without DB migrations; what is uploaded is exactly what is stored. Trade-off: searching inside flags means reading documents, irrelevant at single-user scale.
2. **Fully relational** (commands, flags, examples, use cases, procedures, steps… ~8 tables). Any query possible, but every new JSON field needs a migration and mapping code. Over-engineered for a personal app.
3. **Extend the current item format.** Rejected: contradicts command-centric organization and keeps the duplicate-on-reimport problem.

**Validation library:** Zod 4 as the single source of truth: it validates uploads, generates the JSON Schema embedded in the copyable prompt (`z.toJSONSchema`), and types the TypeScript code. One dependency; prompt and validator cannot drift.

## 5. Content Format (pack v1)

One upload = one pack = one topic with any number of commands and procedures.

```json
{
  "format": "netdrill.pack/v1",
  "topic": {
    "slug": "linux",
    "title": "Linux Administration",
    "description": "Troubleshooting processes, sockets and services"
  },
  "commands": [
    {
      "id": "linux.ss",
      "name": "ss",
      "summary": "Socket inspection via Netlink, the modern netstat replacement",
      "synopsis": "ss [options] [filter]",
      "description": "…",
      "flags": [
        { "flag": "-t", "long": "--tcp", "argument": null, "description": "TCP sockets only.", "example": "ss -t" },
        { "flag": "-p", "long": "--processes", "argument": null, "description": "Show owning PID and process (requires root).", "example": "sudo ss -tp" }
      ],
      "examples": [
        {
          "id": "listening-sockets",
          "title": "Listening ports with process",
          "scenario": "List every listening TCP and UDP socket with the owning PID and process name.",
          "command": "ss -tulpn",
          "explanation": "-t TCP, -u UDP, -l LISTEN only, -p process, -n no name resolution.",
          "output": "Netid State  Recv-Q Send-Q Local Address:Port …",
          "output_notes": [
            { "token": "Recv-Q", "meaning": "For LISTEN sockets, completed connections waiting for accept().", "normal": "0 or low and transient.", "anomaly": "Close to Send-Q: the application is not accepting connections fast enough.", "severity": "warning" }
          ],
          "drill": true
        }
      ],
      "use_cases": [
        { "title": "Port stops responding after a deploy", "situation": "…", "severity": "incident" }
      ],
      "pitfalls": ["Without -n, DNS resolution can stall the output."],
      "related": ["linux.lsof"],
      "tags": ["network", "sockets"]
    }
  ],
  "procedures": [
    {
      "id": "linux.cgroup-oom-triage",
      "title": "Triage intermittent OOM in the service cgroup",
      "context": "The API is OOM-killed intermittently under load.",
      "goal": "Compare cgroup memory usage, limit and OOM events.",
      "steps": [
        {
          "command": "cat /sys/fs/cgroup/system.slice/api.service/memory.current",
          "purpose": "Current cgroup memory usage.",
          "output": "1879048192",
          "output_notes": [],
          "interpretation": "Compare with memory.max."
        }
      ],
      "uses": ["linux.cat", "linux.grep"],
      "use_cases": [ { "title": "…", "situation": "…", "severity": "critical" } ],
      "tags": ["memory", "cgroups"]
    }
  ],
  "remove": ["linux.netstat"]
}
```

### Field rules
- `format` must equal `netdrill.pack/v1` (future versions get a new literal).
- `topic.slug`: `^[a-z0-9][a-z0-9-]{0,39}$`. Topic title/description are upserted on every upload.
- Command and procedure `id`: `^<topic.slug>\.[a-z0-9][a-z0-9.-]{0,79}$`, unique across the whole pack (commands and procedures share one namespace). Example `id`: `^[a-z0-9][a-z0-9-]{0,59}$`, unique within its command.
- `command` fields in examples and `steps[].command` may be multi-line (configuration blocks); stored verbatim.
- `severity` of use cases: `routine | incident | critical`. `severity` of output notes: `info | warning | critical`.
- `drill` defaults to `true`; `false` keeps an example in the manual only.
- `uses` and `related` reference command IDs; unknown IDs are accepted (the command may arrive in a later pack) and reported as warnings in the upload result.
- `remove` (optional) deletes listed commands/procedures that belong to `topic.slug`, together with their drills and progress. This is the only deletion path; documents absent from a pack are never touched.
- Required vs optional: required = `format`, `topic.slug`, `topic.title`; command `id`, `name`, `summary`, `synopsis`, `description`; example `id`, `title`, `scenario`, `command`; procedure `id`, `title`, `context`, `steps` (≥ 1, each with `command` and `purpose`). Everything else optional; arrays default to empty. A pack must contain at least one of `commands`, `procedures`, `remove`.
- All prose is English; commands and outputs verbatim.
- Command `name` is free text up to 80 characters and may contain spaces (e.g. FortiOS `config system interface`, `diagnose sys top`); search is case-insensitive substring.
- **Drill sizing (authoring rule, enforced by the prompt):** a drill trains what a practitioner types from memory, one idea per drill. Keep each drill line under ~80 characters. Longer commands are split into short, progressive drills (e.g. `curl -s -o /dev/null -w "%{http_code}\n" localhost:8000/health`, then the same with `%{time_total}`), and the full long form stays as a reference example with `"drill": false` (shown in the manual, never graded). Use short realistic placeholders (`localhost:8000`, `api.service`, `/var/log/app.log`) instead of long IPs and paths. Procedure steps follow the same rule; configuration blocks (e.g. FortiOS) remain valid because each line is short.
- **Long-line warning (non-blocking):** validation emits a warning, never an error, for any drillable line longer than 100 characters, e.g. `commands[3].examples[1].command: long drill line (128 chars); consider splitting or "drill": false`.
- The legacy `cloze` and `quiz` item types are not carried over: they were stored but never rendered by any screen.

## 6. Storage (schema v2)

Replaces every current table. A `schema_meta(version)` row drives a one-time reset: when the stored version is absent or `< 2`, the migration drops the legacy tables (`user_progress`, `items`, `modules`, `topics`, `man_pages`) and creates v2. This is destructive by design (see §10, owner confirmation).

```sql
CREATE TABLE schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE topics (
  slug TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE documents (               -- one row per command or procedure
  id TEXT PRIMARY KEY,                 -- e.g. linux.ss
  kind TEXT NOT NULL CHECK (kind IN ('command','procedure')),
  topic_slug TEXT NOT NULL REFERENCES topics(slug) ON DELETE CASCADE,
  name TEXT NOT NULL,                  -- command name or procedure title (search/list)
  body TEXT NOT NULL,                  -- validated JSON of the command/procedure
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE document_links (          -- procedure uses / command related
  from_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  to_id TEXT NOT NULL,                 -- may point to a not-yet-uploaded command
  relation TEXT NOT NULL CHECK (relation IN ('uses','related')),
  PRIMARY KEY (from_id, to_id, relation)
);

CREATE TABLE drills (
  id TEXT PRIMARY KEY,                 -- linux.ss#listening-sockets | linux.cgroup-oom-triage
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('example','procedure')),
  topic_slug TEXT NOT NULL,
  position INTEGER NOT NULL,           -- order within the document
  created_at TEXT NOT NULL
);

CREATE TABLE progress (
  drill_id TEXT PRIMARY KEY REFERENCES drills(id) ON DELETE CASCADE,
  repetitions INTEGER NOT NULL DEFAULT 0, interval_days INTEGER NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5, due_date TEXT NOT NULL,
  total_drilled_count INTEGER NOT NULL DEFAULT 0, last_reviewed_at TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0, needs_review INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_documents_topic ON documents(topic_slug, kind);
CREATE INDEX idx_drills_topic ON drills(topic_slug);
CREATE INDEX idx_progress_due ON progress(due_date);
```

Cascades are not relied upon: Turso over HTTP does not guarantee `PRAGMA foreign_keys` per request, so the importer deletes `progress → drills → document_links → documents` explicitly. `REFERENCES` clauses stay as documentation.

### Upsert semantics (one `db.batch(..., 'write')` transaction per upload)
1. Upsert topic.
2. For each document: upsert row (`ON CONFLICT(id) DO UPDATE`, keep `created_at`), replace its `document_links`.
3. Rebuild its drills: upsert drills still present (progress kept), delete drills of that document no longer present (their progress cascades), insert `progress` with `due_date = now` for new drills only.
4. Apply `remove` (documents of this topic only; IDs from other topics are a validation error).
5. A document ID already stored under a different `kind` or topic is a validation error (prevents accidental overwrite across topics).

The upload response reports counts: documents created/updated/removed, drills created/removed, warnings (unresolved references).

## 7. Drills and the Study Session
- **Example drill**: prompt = `scenario`, target = `command`, explanation, output + `output_notes`; use cases = the parent command's `use_cases`.
- **Procedure drill**: prompt = `context` + `goal`; target = step commands joined by `\n` (validated with the existing `compareBlock`, block mode); output = the steps' outputs concatenated; output notes = union of steps' notes; use cases = procedure `use_cases`.
- The queue is built from `drills` joined with `progress` and the parent document (body parsed in the server component), mapped to the session's existing item shape so `StudySession`, `TerminalPrompt`, blind test, tabs and SM-2 keep working.
- `output_notes` map onto `MetricDefinition` (`token`, `label ← token`, `description ← meaning`, `normalBaseline ← normal`, `anomalyAlert ← anomaly`, `severity`) and feed `parseAnnotatedOutput(customNotes)`. The static global telemetry glossary stays as a fallback (it is not AI).
- The synthetic "fallback use cases" generated in `StudySession.getEffectiveUseCases` are removed: if the JSON has no use cases, the tab says so (they were fabricated text).
- Topic selector counts drills per topic and due drills, as today.

## 8. Manual
- `/man`: catalog of command documents (search by `name`), plus a procedures list per topic.
- `/man/[id]`: command page (synopsis, description, flags table, examples with output, use cases, pitfalls, related commands, "procedures that use this command" via `document_links`), or a procedure page (context, goal, numbered steps with output and interpretation, linked commands). Route parameter is the document ID (names collide across topics, e.g. `ping`).
- Man modal (`M`, `:man <cmd>`): searches commands by `name` (case-insensitive); several matches → short chooser.
- Removed: AI badge, "regenerate" button, generation spinner, `source`/bundled distinctions. The external man7 search link stays.

## 9. Import Screen and Prompt
- `/import`: paste or choose a `.json` file, **Validate** (dry run, shows the counts it would apply and any errors/warnings) and **Import** (applies). Buttons disable during requests (AGENTS.md §3.5).
- Errors list each issue as `path: message` (e.g. `commands[0].examples[2].command: Required`). Database failures return a generic message; details go to server logs only.
- AGENTS.md §1 and §3.6 are amended: UI language becomes English (formal, technical register); anti-redundancy and anti-leakage rules unchanged.
- **Copiar prompt**: copies a prompt assembled from a template (`src/lib/content/prompt.ts`) containing: role and goal, the placeholder `[DESCRIBE THE TOPIC AND THE COMMANDS/PROCEDURES YOU WANT]`, authoring rules from §5 (IDs, English prose, verbatim commands, realistic outputs, no invented flags), the JSON Schema from `z.toJSONSchema`, and the compact example. The UI shows a short preview and a "Copied" confirmation.
- API: `POST /api/import` (apply) and `POST /api/import?dryRun=true` (validate only), body ≤ 2 MB, JSON only. Contract documented in `docs/api/import-contract.md` with the generated JSON Schema.

## 10. Removal List
- AI: `src/lib/nemotron-generator.ts`, `src/lib/man-db.ts`, JIT branch of `src/app/api/man/[cmd]/route.ts`, AI UI in `ManModal.tsx`, `src/app/man/page.tsx`, `src/app/man/[cmd]/page.tsx`, their tests (`nemotron-generator`, `man-db`, related `man-api` cases), `OPENROUTER_API_KEY` from `.env*.example` and Vercel project env (owner action, documented).
- Legacy content: `src/data/seed-data.json`, `src/data/netdrill_linux_avancado_diagnostico_processos_300.json`, `src/data/man/*`, `src/lib/man-engine.ts` (bundled pages), `src/lib/importer.ts` (replaced), `scripts/seed.ts`, `db:seed` script, the seed step in `scripts/deploy.sh`, related tests.
- Legacy schema: `src/lib/schema.sql` and `SCHEMA_SQL` replaced by v2.
- Docs: superseded parts of `2026-11-20-nemotron-manpage-generator-design.md` marked as superseded; ADR `0006-command-centric-content-documents.md` (MADR) records approach 1.

**Production effect:** the first deploy with schema v2 drops all existing content, progress, favorites and review flags in Turso. Owner confirmed both content and progress may be discarded (2026-11-20).

## 11. UI Approval Gates (before UI code)
Prototypes under `prototypes/<slug>/` with approval logs, in this order:
1. `content-import`: new `/import` (paste/file, validate, import, copy prompt, result/errors).
2. `command-manual`: `/man` catalog and `/man/[id]` for command and procedure pages, plus modal chooser.
3. Study session changes are data and copy only (no layout change): English copy is applied to the approved `mobile-redesign` layout without a new prototype.

## 11b. Deferred
- **Multiple-choice interpretation questions:** rejected for memorizing commands (recognition instead of recall, would inflate SM-2 progress, weak LLM-generated distractors). Kept as a possible future complement to the annotated-output tab, limited to interpreting outputs and long reference commands; needs its own drill type and prototype.
- **Step-by-step procedure drill** (one step at a time with output and interpretation in between): deferred to a later iteration; needs its own prototype. v1 drills a procedure as a whole block.

## 12. Decided vs Left to the Builder
**Decided by the owner:** command-centric model; commands + procedures (train everything); upload via `/import`; copyable prompt in the UI; no migration, legacy schema, data and production progress deleted; AI removed; storage approach 1; UI and content in English.

**Builder's discretion:** module layout under `src/lib/content/`; query shapes; exact prompt wording within §9; Zod schema structure; test layout (follow the SSR component test convention in `docs/DEVELOPMENT.md`).
