# Command-Centric Content Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AI-generated manuals and the item-based importer with uploaded, Zod-validated JSON packs of commands and procedures that feed both the manual and the drills, with the whole UI in English.

**Architecture:** Each command/procedure is stored whole as a validated JSON document (`documents.body`); small tables index what is queried (`topics`, `drills`, `progress`, `document_links`). A single Zod 4 schema validates uploads, types the code and generates the JSON Schema embedded in the copyable authoring prompt.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, libSQL/Turso, Vitest (node env, SSR markup tests), Zod 4.

**Spec:** `docs/superpowers/specs/2026-11-20-command-centric-content-design.md`

## Global Constraints

- Everything in English: code, docs, UI copy, error messages, uploaded content, authoring prompt. Formal, technical register; no internals in user-facing errors (AGENTS.md §3.6 anti-leakage still applies).
- Pack literal: `"format": "netdrill.pack/v1"`.
- Patterns: topic slug `^[a-z0-9][a-z0-9-]{0,39}$`; document id `^<topic.slug>\.[a-z0-9][a-z0-9.-]{0,79}$`; example id `^[a-z0-9][a-z0-9-]{0,59}$`; command `name` free text 1–80 chars.
- Enums: use case severity `routine | incident | critical`; output note severity `info | warning | critical`.
- Long drill line warning threshold: a drillable line longer than **100** characters (warning, never error). Authoring guidance in the prompt: under ~80 characters per drill line.
- Upload body limit **2 MB**; one `db.batch(..., 'write')` per upload; nothing written when validation fails.
- Do not rely on SQLite `ON DELETE CASCADE` (Turso over HTTP does not guarantee `PRAGMA foreign_keys` per request): the importer deletes `progress → drills → document_links → documents` explicitly. Keep `REFERENCES` clauses for documentation only.
- No runtime AI/LLM calls anywhere; no `OPENROUTER_API_KEY` usage.
- TDD for every production change; `make check` exits 0 before each commit; Conventional Commits.
- UI tasks start only after the owner approves the corresponding prototype (Task 1).

## Review Focus

1. Uploading the same pack twice → identical row counts and untouched progress (Task 4 test `reimport is idempotent and keeps progress`).
2. Re-uploading a command with one example deleted → only that drill and its progress disappear (Task 4 test `dropped example removes its drill and progress only`).
3. Body that is not JSON, is a JSON array/string, or exceeds 2 MB → 400 with a readable message, no writes (Task 5 tests).
4. A document id that already exists under another topic or kind, or a `remove` id from another topic → validation issue, no writes (Task 4 tests).
5. Procedure steps containing multi-line FortiOS blocks with indentation → drill target keeps line order and leading spaces and is validated in block mode (Task 4 `deriveDrillContent` test, Task 6 queue test).

---

### Task 1: Prototypes for the import screen and the manual (approval gate)

**Files:**
- Create: `prototypes/content-import/index.html`, `prototypes/content-import/README.md`
- Create: `prototypes/command-manual/index.html`, `prototypes/command-manual/README.md`

**Interfaces:**
- Produces: approved layouts consumed by Tasks 7 and 8.

- [ ] **Step 1: Build `content-import` prototype** — Claude Design canvas (native artifact tool) with mobile 390×844 and desktop artboards: paste area + file picker, `Validate` / `Import` buttons (disabled while busy), `Copy prompt` with a short preview and `Copied` confirmation, result panel (created/updated/removed counts, warnings list), error list (`path: message`). English copy.
- [ ] **Step 2: Build `command-manual` prototype** — catalog (`/man`) with search and per-topic procedures list; command page (synopsis, description, flags table, examples with output, use cases, pitfalls, related, "Used in procedures"); procedure page (context, goal, numbered steps with output and interpretation, linked commands); man modal with multi-match chooser. Mobile and desktop.
- [ ] **Step 3: Version both** under `prototypes/<slug>/` (index.html gallery + canvas sources, README with route, user stories, responsive breakdown, state matrix, `Status: PENDING_APPROVAL`).
- [ ] **Step 4: STOP — ask the owner to approve.** On approval set `Status: APPROVED`, `Approved By: Doretto`, date, then commit:

```bash
git add prototypes/content-import prototypes/command-manual
git commit -m "docs(prototypes): add approved content import and command manual prototypes"
```

### Task 2: Pack schema and validation

**Files:**
- Modify: `package.json` (add `zod@^4.6.7`)
- Create: `src/lib/content/schema.ts`
- Test: `tests/content-schema.test.ts`

**Interfaces:**
- Produces (from `src/lib/content/schema.ts`):
  - `PACK_FORMAT = 'netdrill.pack/v1'`, `packSchema` (Zod)
  - types `Pack`, `Topic`, `CommandDoc`, `ProcedureDoc`, `Flag`, `Example`, `Step`, `OutputNote`, `UseCase` (`z.infer` of the matching sub-schemas; field names exactly as spec §5, snake_case kept: `use_cases`, `output_notes`)
  - `interface ValidationIssue { path: string; message: string }`
  - `validatePack(raw: unknown): { ok: true; pack: Pack; warnings: ValidationIssue[] } | { ok: false; issues: ValidationIssue[] }`
  - `packJsonSchema(): Record<string, unknown>` (via `z.toJSONSchema(packSchema)`)
  - `LONG_DRILL_LINE = 100`

- [ ] **Step 1: Write failing tests** in `tests/content-schema.test.ts` using a fixture `validPack()` built from spec §5 (one command `linux.ss` with one example, one procedure `linux.cgroup-oom-triage` with one step):
  - `accepts the spec example and fills defaults` → `ok`; `pack.commands[0].examples[0].drill === true`; `pack.commands[0].flags`… omitted arrays become `[]`.
  - `rejects a wrong format literal` → issue path `format`.
  - `reports nested paths` → removing `commands[0].examples[0].command` gives issue path `commands[0].examples[0].command`.
  - `requires ids to start with the topic slug` → `redes.ss` in a `linux` pack fails at `commands[0].id`.
  - `rejects duplicate ids across commands and procedures` and `duplicate example ids within a command` → issue on the second occurrence.
  - `requires at least one of commands, procedures or remove` → issue path `""` (root).
  - `warns on long drill lines` → a 128-char drillable example yields `warnings[0].message` containing `long drill line (128 chars)`; same line with `drill: false` yields no warning; a multi-line step checks each line separately.
  - `packJsonSchema exposes the format literal` → JSON includes `"netdrill.pack/v1"`.
- [ ] **Step 2: Run** `npx vitest run tests/content-schema.test.ts` → FAIL (module missing).
- [ ] **Step 3: Implement** `src/lib/content/schema.ts`. Cross-field rules (topic prefix, uniqueness, at-least-one) via `superRefine` on the pack; issue paths joined as `a[0].b` from Zod `issue.path`. Warnings computed after a successful parse.
- [ ] **Step 4: Run** the test file → PASS; `npm test` → all green.
- [ ] **Step 5: Commit** `feat(content): add zod pack schema and validation`.

### Task 3: Schema v2 migration

**Files:**
- Modify: `src/lib/migrate.ts` (replace `SCHEMA_SQL`), delete `src/lib/schema.sql`
- Create: `docs/adr/0006-command-centric-content-documents.md` (MADR, approach 1 vs 2 vs 3 from spec §4)
- Modify: `.agents/memory/decisions.md` (content model, upload-only ingestion, AI removal, English UI)
- Test: rewrite `tests/db.test.ts`

**Interfaces:**
- Produces: `SCHEMA_VERSION = '2'`; `runMigrations(db: Client): Promise<void>`; tables exactly as spec §6.

- [ ] **Step 1: Failing tests** in `tests/db.test.ts`:
  - `creates v2 tables` → `schema_meta, topics, documents, document_links, drills, progress` exist; `schema_meta` has `('version','2')`.
  - `drops legacy tables on first v2 migration` → create legacy `items`, `modules`, `user_progress`, `man_pages` and an old-shape `topics(id, slug, title)` with a row, run migrations → legacy tables gone, `topics` has v2 columns and no rows.
  - `is idempotent on v2` → insert a v2 topic, run migrations again → row still present.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**: read `schema_meta.version` (table may not exist); when not `'2'`, drop `user_progress, items, modules, topics, man_pages, progress, drills, document_links, documents` if present, create v2, write version. All in one batch.
- [ ] **Step 4: Run** `tests/db.test.ts` → PASS. Other suites referencing legacy tables now fail; they are rewritten or deleted in Tasks 5–7 — list them in the commit body. To keep `make check` green in this commit, mark `tests/session.test.ts`, `tests/flags.test.ts`, `tests/importer.test.ts`, `tests/seed.test.ts` with `describe.skip` and a `// replaced in Task 5/6` comment.
- [ ] **Step 5: Commit** `feat(db): replace schema with command-centric v2` (+ ADR, decisions).

### Task 4: Drill derivation and pack importer

**Files:**
- Create: `src/lib/content/drills.ts`, `src/lib/content/importer.ts`
- Test: `tests/content-drills.test.ts`, `tests/content-importer.test.ts`

**Interfaces:**
- Consumes: Task 2 types/`validatePack`; Task 3 tables.
- Produces (`drills.ts`):
  - `interface DrillRef { id: string; kind: 'example' | 'procedure'; position: number }`
  - `drillRefsFor(doc: CommandDoc | ProcedureDoc, kind: 'command' | 'procedure'): DrillRef[]` — example drill id `${doc.id}#${example.id}` (only `drill !== false`); procedure drill id = `doc.id`.
  - `interface DrillContent { title: string; prompt: string; target: string; isMultiLine: boolean; explanation?: string; output?: string; outputNotes: OutputNote[]; useCases: UseCase[] }`
  - `deriveDrillContent(ref: DrillRef, doc: CommandDoc | ProcedureDoc): DrillContent` — example: prompt `scenario`, target `command`, use cases from the command; procedure: prompt `` `${context}\n\nGoal: ${goal}` `` (goal line omitted when absent), target = step commands joined by `\n`, output = non-empty step outputs joined by `\n`, notes = concatenation of step notes, use cases from the procedure. `isMultiLine = target.includes('\n')`.
- Produces (`importer.ts`):
  - `interface ImportSummary { documentsCreated: number; documentsUpdated: number; documentsRemoved: number; drillsCreated: number; drillsRemoved: number }`
  - `type ImportResult = { ok: true; dryRun: boolean; summary: ImportSummary; warnings: ValidationIssue[] } | { ok: false; issues: ValidationIssue[] }`
  - `importPack(db: Client, raw: unknown, opts?: { dryRun?: boolean }): Promise<ImportResult>`

- [ ] **Step 1: Failing tests** `tests/content-drills.test.ts`: example ids and `drill:false` exclusion; procedure prompt/target/output/notes as specified; `keeps indentation of multi-line FortiOS steps` (step `config system interface\n    edit "port1"\n    next\nend` → target contains `    edit "port1"`, `isMultiLine` true).
- [ ] **Step 2: Failing tests** `tests/content-importer.test.ts` (`getDbClient(':memory:')` + `runMigrations`):
  - `imports a pack` → summary `{documentsCreated: 2, drillsCreated: 2, …}`, progress rows with `due_date <= now`.
  - `reimport is idempotent and keeps progress` → set `progress.repetitions = 3` on one drill, import same pack again → counts unchanged, repetitions still 3, `documentsUpdated: 2`.
  - `dropped example removes its drill and progress only`.
  - `remove deletes documents of this topic` and `rejects remove ids from another topic` (issue `remove[0]`).
  - `rejects an id stored under another topic or kind` (issue at the document path).
  - `dryRun writes nothing` → table counts unchanged, summary still computed.
  - `warns about unresolved uses/related ids` → warning path `procedures[0].uses[1]`; no warning when the id exists in the DB or in the same pack.
  - `returns validation issues without writing` for an invalid pack.
  - `hides database errors` → a closed/failing client yields `{ ok: false, issues: [{ path: '', message: 'The import could not be completed. Please try again.' }] }` and logs via `console.error`.
- [ ] **Step 3: Run** both → FAIL.
- [ ] **Step 4: Implement** `drills.ts` then `importer.ts`. Summary is computed by reading existing `documents`/`drills` ids before writing; all writes in one `db.batch(statements, 'write')`; explicit delete order per Global Constraints; `documents.name` = command `name` or procedure `title`; links rebuilt per document (`uses`, `related`).
- [ ] **Step 5: Run** → PASS; `npm test` green.
- [ ] **Step 6: Commit** `feat(content): derive drills and import packs idempotently`.

### Task 5: Import API; remove legacy importer, seed and data

**Files:**
- Modify: `src/app/api/import/route.ts`
- Delete: `src/lib/importer.ts`, `scripts/seed.ts`, `src/data/seed-data.json`, `src/data/netdrill_linux_avancado_diagnostico_processos_300.json`, `tests/importer.test.ts`, `tests/seed.test.ts`
- Modify: `package.json` (remove `db:seed`), `scripts/deploy.sh` (remove step 3 seeding, renumber), `docs/api/import-contract.md` (pack contract + generated JSON Schema + response shapes), `docs/api/README.md` if it lists endpoints
- Test: `tests/import-api.test.ts`

**Interfaces:**
- Consumes: `importPack`.
- Produces: `POST /api/import[?dryRun=true]` → 200 `ImportResult` (ok) | 400 `{ ok: false, issues }` | 413 `{ ok: false, issues: [{ path: '', message: 'The file exceeds the 2 MB limit.' }] }`.

- [ ] **Step 1: Failing tests** calling the exported `POST` with `new NextRequest(...)` (pattern from `tests/man-api.test.ts`), DB via `TURSO_DATABASE_URL=file::memory:` or an injected client — choose the pattern `man-api.test.ts` already uses:
  - valid pack → 200, `ok: true`; `?dryRun=true` → `dryRun: true`, no rows.
  - body `not json` → 400 message `The file is not valid JSON.`
  - body `[]` / `"x"` → 400 issue at root (`Expected a pack object`).
  - body > 2 MB (`content-length` header or measured text length) → 413.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (read `req.text()`, size check, `JSON.parse` in try, `runMigrations`, `importPack`). **Step 4: Run** → PASS.
- [ ] **Step 5: Delete** legacy files listed above; `npm test`, `npx tsc --noEmit` → green (nothing else imports them; verify with `grep -rn "lib/importer\|seed-data" src scripts`).
- [ ] **Step 6: Commit** `feat(api): accept validated content packs and drop legacy seed`.

### Task 6: Session queue, progress APIs and study session data

**Files:**
- Modify: `src/lib/session.ts`, `src/app/api/progress/route.ts`, `src/app/api/progress/flag/route.ts`, `src/app/page.tsx` (types only), `src/components/StudySession.tsx`
- Test: rewrite `tests/session.test.ts`, `tests/flags.test.ts`; update `tests/mobile-study-session.test.tsx` fixture

**Interfaces:**
- Consumes: `drillRefsFor` ids, `deriveDrillContent`, `CommandDoc`, `ProcedureDoc`, `UseCase`, `OutputNote`.
- Produces (`session.ts`):
  - `TopicSummary` unchanged (`id` = slug).
  - `interface QueueItem { id: string; documentId: string; kind: 'example' | 'procedure'; title: string; prompt: string; target: string; isMultiLine: boolean; explanation?: string; output_sample?: string; output_notes: OutputNote[]; use_cases: UseCase[]; is_favorite: boolean; needs_review: boolean; isDue: boolean }`
  - `getAvailableTopics(db)`, `buildSessionQueue(db, topicFilter?)` with the same ordering rule as today (due first, then never reviewed, then by due date, then `drills.position`).
  - Progress APIs accept `{ drillId, grade }` and `{ drillId, isFavorite?, needsReview? }` on table `progress`.

- [ ] **Step 1: Failing tests**: `tests/session.test.ts` imports a fixture pack with `importPack`, then: due drill first; topic filter; `QueueItem` fields from `deriveDrillContent`; procedure item `isMultiLine` true. `tests/flags.test.ts`: favorite/needs-review round trip on `progress`. Add progress-route test `upserts SM-2 values for drillId`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** queries on `drills JOIN documents LEFT JOIN progress`, parse `body` JSON once per document.
- [ ] **Step 4: Update `StudySession.tsx`**: `isMulti = currentItem.isMultiLine`; delete `getEffectiveUseCases` fabricated fallback; use cases tab renders `currentItem.use_cases` (severity badge: `critical` → red "Critical", `incident` → amber "Incident", `routine` → cyan "Routine"); empty list shows `No use cases recorded for this command.`; `parseAnnotatedOutput(output_sample, notes)` where notes map `OutputNote` → `{ token, label: token, description: meaning, normalBaseline: normal, anomalyAlert: anomaly, severity }`; POST bodies use `drillId`. Update `tests/mobile-study-session.test.tsx` fixture to the new `QueueItem`; add test `shows the empty use-case message` (render with `activeTab` default is Treino, so test the mapping helper `toMetricNotes(notes: OutputNote[])` exported from `session.ts` instead).
- [ ] **Step 5: Run** `npm test`, `npx tsc --noEmit` → green. Remove `describe.skip` from Task 3.
- [ ] **Step 6: Commit** `feat(session): build drills queue from content documents`.

### Task 6b: Keyboard-aware typing mode on mobile (fixes hidden input on iPhone)

**Context (root cause, measured at 390×844):** the command field starts at y=568 px in a non-scrolling 844 px page, while ~420–460 px stay visible with the iPhone keyboard open. The layout assumes the viewport shrinks (`interactive-widget=resizes-content` + sticky dock), which iOS Safari ignores, so the field and the 121 px symbol dock end up under the keyboard. The approved `mobile-redesign` screen 3 ("Digitando") typing state was never implemented.

**Files:**
- Create: `src/lib/visual-viewport.ts`, `src/components/useKeyboardInset.ts`
- Modify: `src/components/StudySession.tsx`, `src/components/TerminalPrompt.tsx` (expose `onFocusChange?: (focused: boolean) => void`), `src/components/MobileKeyboardBar.tsx`
- Test: `tests/visual-viewport.test.ts`, extend `tests/mobile-study-session.test.tsx`

**Interfaces:**
- Produces:
  - `keyboardInset(layoutHeight: number, viewport: { height: number; offsetTop: number } | null): number` — `max(0, round(layoutHeight - viewport.height - viewport.offsetTop))`, `0` when `viewport` is null (pure, in `visual-viewport.ts`).
  - `useKeyboardInset(): { inset: number; visibleHeight: number; offsetTop: number }` — subscribes to `window.visualViewport` `resize`/`scroll`; SSR-safe (returns zeros/`innerHeight` fallback).
  - `StudySession` prop-free internal state `isTyping` (focus of the command field, mobile only via `matchMedia('(max-width: 1023px)')`).

- [ ] **Step 1: Failing tests** `tests/visual-viewport.test.ts`: `keyboardInset(844, null) === 0`; `keyboardInset(844, { height: 470, offsetTop: 0 }) === 374`; `keyboardInset(844, { height: 470, offsetTop: 40 }) === 334`; never negative (`{ height: 900, offsetTop: 0 }` → 0).
- [ ] **Step 2: Failing SSR test**: export `StudyTypingLayout` (presentational, props `{ isTyping: boolean; visibleHeight: number; offsetTop: number; children }`) → with `isTyping` it renders `class` containing `fixed inset-x-0` and inline `height: 470px; top: 0px` for `visibleHeight=470, offsetTop=0`; without `isTyping` it renders a plain wrapper (no `fixed`).
- [ ] **Step 3: Run** → FAIL. **Step 4: Implement**: while typing on mobile, the session (compact header + scenario clamped to 3 lines + reference + field + dock) renders inside `StudyTypingLayout` sized to the visual viewport; explanation and the `[STDOUT]` toggle are hidden; the dock becomes the last flex child (no `sticky`), so it sits directly above the keyboard. On focus and on every viewport resize while typing, call `textarea.scrollIntoView({ block: 'nearest' })`. Symbol keys keep `onMouseDown preventDefault` so focus (and the keyboard) stays. Blur restores the reading layout. Desktop (`lg`) unaffected.
- [ ] **Step 5: Run** `npm test` → PASS. **Step 6: Verify in Chrome** at 390×844 by shrinking the emulated viewport to 390×470 while the field is focused (Android-like) and by overriding `window.visualViewport` via an init script to `{ height: 470, offsetTop: 0 }` with layout 844 (iOS-like): field bottom ≤ visible height and dock directly above it in both. Final confirmation on the owner's iPhone.
- [ ] **Step 7: Commit** `fix(mobile): keep the command field and dock above the virtual keyboard`.

### Task 7: Manual on content documents; remove AI (after Task 1 approval)

**Files:**
- Create: `src/lib/content/catalog.ts`
- Modify: `src/app/api/man/route.ts`, `src/app/api/man/[cmd]/route.ts` (param is a document id), `src/app/man/page.tsx`, `src/app/man/[cmd]/page.tsx`, `src/components/ManModal.tsx` (per approved `command-manual` prototype)
- Delete: `src/lib/nemotron-generator.ts`, `src/lib/man-db.ts`, `src/lib/man-engine.ts`, `src/data/man/`, `tests/nemotron-generator.test.ts`, `tests/man-db.test.ts`, `tests/man-engine.test.ts`
- Modify: `.env*.example` (remove `OPENROUTER_API_KEY`), `docs/DEVELOPMENT.md` (env list), mark `docs/superpowers/specs/2026-11-20-nemotron-manpage-generator-design.md` status `Superseded by 2026-11-20-command-centric-content-design.md`
- Test: `tests/content-catalog.test.ts`, rewrite `tests/man-api.test.ts`, SSR test `tests/command-manual.test.tsx`

**Interfaces:**
- Produces (`catalog.ts`):
  - `interface DocumentSummary { id: string; kind: 'command' | 'procedure'; topicSlug: string; name: string; summary: string }` (procedure summary = `goal ?? context`)
  - `listDocuments(db, opts?: { kind?: 'command' | 'procedure'; query?: string; topicSlug?: string }): Promise<DocumentSummary[]>` (case-insensitive substring on `name`)
  - `getDocument(db, id): Promise<{ summary: DocumentSummary; body: CommandDoc | ProcedureDoc; uses: DocumentSummary[]; usedBy: DocumentSummary[]; related: DocumentSummary[] } | null>`
  - `GET /api/man?q=&kind=` → `DocumentSummary[]`; `GET /api/man/[id]` → `getDocument` result or 404 `{ error: 'No manual entry found for this command.' }`.

- [ ] **Step 1: Failing tests** for `catalog.ts` (search, kind filter, backlinks `usedBy` of `linux.cat` includes the OOM procedure, missing id → null) and the two routes (200/404, no `source`/AI fields).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `catalog.ts` and routes.
- [ ] **Step 4: Failing SSR tests** `tests/command-manual.test.tsx` for the page components' presentational parts (extract `CommandEntry` and `ProcedureEntry` components rendering a given document): flags rendered as a table with headers `Flag`, `Description`; examples show output; `Used in procedures` lists links to `/man/<id>`; no text matching `/AI|Nemotron|Regenerate/`.
- [ ] **Step 5: Implement** pages and modal per prototype (modal: one match opens it, several show a chooser). Delete AI and bundled-manual files. Run `npm test`, `npx tsc --noEmit`, `grep -rni "nemotron\|openrouter" src` → empty.
- [ ] **Step 6: Commit** `feat(man): serve manual from content documents and remove AI generation`.

### Task 8: Import screen and authoring prompt (after Task 1 approval)

**Files:**
- Create: `src/lib/content/prompt.ts`
- Modify: `src/app/import/page.tsx` (per approved `content-import` prototype)
- Test: `tests/content-prompt.test.ts`, `tests/import-page.test.tsx`

**Interfaces:**
- Consumes: `packJsonSchema`, `PACK_FORMAT`, `LONG_DRILL_LINE`, `POST /api/import`.
- Produces: `buildAuthoringPrompt(): string`; `PROMPT_TOPIC_PLACEHOLDER = '[DESCRIBE THE TOPIC AND THE COMMANDS/PROCEDURES YOU WANT]'`.

- [ ] **Step 1: Failing tests** `tests/content-prompt.test.ts`: prompt contains the placeholder, `netdrill.pack/v1`, the stringified JSON Schema, an example that passes `validatePack` (extract it from the prompt between fenced markers and validate), and the rules: `English`, `under 80 characters`, `"drill": false`, `stable ids`, `do not invent flags`, `output only the JSON`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** `prompt.ts` (example object defined in code and validated by the test).
- [ ] **Step 4: Failing SSR tests** `tests/import-page.test.tsx`: renders `Copy prompt`, `Validate`, `Import`, a labelled textarea and file input; no Portuguese strings (`/[ãçõ]|Importar|Validar/` absent).
- [ ] **Step 5: Implement** the page: buttons disable while a request runs; result panel shows summary counts and warnings; error list shows `path: message`; clipboard copy with `Copied` state (fallback: select a read-only textarea when `navigator.clipboard` is unavailable).
- [ ] **Step 6: Run** `npm test` → green; **Commit** `feat(import): add pack upload screen with copyable authoring prompt`.

### Task 9: Whole UI in English

**Files:**
- Modify: `src/app/layout.tsx` (`lang="en"`, metadata description), `src/app/login/page.tsx`, `src/app/page.tsx`, `src/components/TopicSelector.tsx`, `StudySession.tsx`, `TimerHeader.tsx`, `TerminalPrompt.tsx`, `MobileKeyboardBar.tsx`, `AnnotatedOutput.tsx`, `src/lib/validator.ts` messages if user-facing, all API error strings
- Modify: `AGENTS.md` (§1 Language: UI strictly English, formal technical register; §3.2/§3.6 references to pt-BR → English), `.agents/memory/decisions.md` (language decision), `prototypes/mobile-redesign/README.md` (note English copy)
- Test: update every `tests/mobile-*.test.tsx` expectation to English; add `tests/ui-language.test.ts`

**Interfaces:**
- Consumes: all screens from previous tasks. Copy follows the existing meaning (e.g. `Treino` → `Drill`, `Casos de uso` → `Use cases`, `Saída anotada` → `Annotated output`, `Teste cego` → `Blind test`, `Validar` → `Validate`, `Ver gabarito` → `Show answer`, `Quebrar linhas` → `Wrap lines`, `Iniciar treino` → `Start session`, `Treino de hoje` → `Today's session`, `Selecione ao menos um tópico` → `Select at least one topic`; `formatSelectionSummary` → `2 topics · 20 drills · 15 min`, singular `1 topic · 1 drill`, free time `no limit`).

- [ ] **Step 1: Failing test** `tests/ui-language.test.ts`: scan `src/**/*.tsx` and `src/app/api/**/*.ts` string literals/JSX text for Portuguese markers (`/[ãõçáéíóúâêô]/i` and words `Sessão|Tópico|Exercício|Importar|Sair|Validar|Gabarito`) → expect none. Update existing SSR tests to English expectations (they fail).
- [ ] **Step 2: Run** → FAIL. **Step 3: Translate** all copy; aria-labels too (`Mudar tópicos` → `Change topics`, `Pausar cronômetro` → `Pause timer`, symbol keys `Hyphen, Underscore, Slash, Pipe, Quote, Dollar, Colon, Redirect, Tab`).
- [ ] **Step 4: Run** `make check` → 0. **Step 5: Commit** `feat(ui): switch the whole interface to English` (+ AGENTS.md, decisions).

### Task 10: Verify, merge and deploy (owner-triggered)

- [ ] **Step 1:** `make check` → 0; `npm run build` → success.
- [ ] **Step 2:** Run locally (`next start`), upload a sample pack through `/import` (validate, then import), drill one example and one procedure in a 390×844 mobile emulation and desktop, open `/man/<id>` and the modal; screenshot evidence into `prototypes/content-import/screens/` and `prototypes/command-manual/screens/`.
- [ ] **Step 3:** Ask the owner before merging and deploying. On approval: fast-forward `main`, push, `npx vercel --prod --yes` from the project directory (`.vercelignore` in place). First request runs migrations and **drops all production content and progress** (confirmed by the owner on 2026-11-20).
- [ ] **Step 4:** `npx vercel env rm OPENROUTER_API_KEY production --yes`; smoke test `/login` 200 and `/import` behind auth (307).
