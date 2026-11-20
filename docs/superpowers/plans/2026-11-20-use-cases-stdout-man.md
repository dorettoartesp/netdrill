# Casos de Uso, Interpretação de STDOUT & Biblioteca Man Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform NetDrill from purely a muscle-memory typing drill into a deep technical learning platform by adding practical incident use cases, an annotated STDOUT metric dissection engine, and an embedded offline/serverless Linux `man` manual system accessible in-session and standalone.

**Architecture:** A hybrid architecture combining database extensions (`use_cases`, `output_notes` in `items`) with a global CLI telemetry glossary fallback (`telemetry-glossary.ts`) to immediately annotate all 330 existing items. The study workspace is expanded into a 3-tab layout (`Treino`, `Casos de Uso`, `STDOUT Anotado`) with an in-session floating manual modal (`ManModal`), a standalone `/man` portal, and an automated timer freeze (`[EM ESTUDO]`) during reading.

**Tech Stack:** Next.js 14 App Router, TypeScript, React 19, Tailwind CSS, Turso libSQL / SQLite, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-use-cases-stdout-interpretation-design.md`

## Global Constraints

- Zero hardcoded local machine paths in tracked files (`make portability` gate).
- All user-facing UI copy strictly in formal Brazilian Portuguese (pt-BR).
- Monospace retro-terminal aesthetics conforming to `DESIGN.md` tokens (no AI slop, no nested cards, WCAG AA contrast $\ge 4.5:1$).
- Mobile inputs locked to $\ge 16\text{px}$ to prevent iOS Safari auto-zoom.
- All code, docstrings, commits, and tests strictly in English.
- `make check` (lint, semgrep, gitleaks, vitest, portability) must pass before any commit.

## Review Focus

- **Input with missing `use_cases`:** Legacy items with `NULL` or missing `use_cases` must automatically render synthesized incident scenarios without throwing errors or blank screens.
- **Tokens with regex metacharacters in STDOUT:** Metric hotspot parsing in terminal output must safely escape characters like `%`, `+`, `[`, `]` (e.g. `%CPU`, `TIME+`, `STAT`).
- **Malformed custom `output_notes` JSON in decks:** Importer and UI must safely handle non-JSON or corrupted strings gracefully.
- **Rapid tab switching and timer state:** Switching between `Treino` (`Ctrl+1`) and educational tabs (`Ctrl+2`, `Ctrl+3`, `ManModal`) must never corrupt or lose countdown seconds or resume the interval twice.
- **Escape / Close propagation in `ManModal`:** Pressing `Esc` or `q` inside the `ManModal` must close the modal and return cursor focus directly to the terminal input without losing active typing text.

---

### Task 1: Database Schema & Ingestion Extension

**Files:**
- Modify: `src/lib/schema.sql`
- Modify: `src/lib/session.ts:1-70`
- Modify: `src/lib/importer.ts:1-120`
- Test: `tests/importer.test.ts`

**Interfaces:**
- `QueueItem` in `src/lib/session.ts` gains `use_cases?: string | null; output_notes?: string | null;`
- `ItemData` in `src/lib/importer.ts` supports `use_cases?: unknown; output_notes?: unknown;`

- [ ] **Step 1: Write failing test for extended item schema ingestion**

Add test in `tests/importer.test.ts`:
```typescript
it('should ingest and serialize use_cases and output_notes in bulk deck import', async () => {
  const deck = {
    topic: 'test-topic',
    topic_title: 'Test Topic',
    module: 'test-module',
    module_title: 'Test Module',
    items: [
      {
        type: 'command',
        title: 'Ver processos com detalhes',
        prompt: 'Investigue consumo anormal de CPU',
        target: 'ps aux',
        output_sample: 'USER PID %CPU STAT COMMAND\nroot 1 0.0 S /sbin/init',
        explanation: 'Exibe processos',
        use_cases: [
          { title: 'Lentidão em Servidor', description: 'Worker em loop', severity: 'warning' }
        ],
        output_notes: [
          { token: 'STAT', label: 'Estado', severity: 'info', description: 'Estado do processo', normalBaseline: 'S', anomalyAlert: 'D constante' }
        ]
      }
    ]
  };

  const db = getDbClient(':memory:');
  await initDb(db);
  const result = await importBulkData(db, deck);
  expect(result.insertedItems).toBe(1);

  const row = await db.execute({ sql: 'SELECT use_cases, output_notes FROM items LIMIT 1;', args: [] });
  expect(row.rows[0].use_cases).toContain('Lentidão em Servidor');
  expect(row.rows[0].output_notes).toContain('Estado do processo');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/importer.test.ts`
Expected: FAIL (missing columns or schema properties)

- [ ] **Step 3: Implement database migration and ingestion support**

In `src/lib/schema.sql`, add columns to `items`:
```sql
use_cases TEXT,
output_notes TEXT,
```
In `src/lib/session.ts`, update `QueueItem` interface and query:
```typescript
export interface QueueItem {
  id: string;
  type: string;
  title: string;
  prompt: string;
  target: string;
  output_sample?: string | null;
  explanation?: string | null;
  use_cases?: string | null;
  output_notes?: string | null;
  // ...
}
```
In `src/lib/importer.ts`, serialize `use_cases` and `output_notes` to JSON strings when arrays/objects are provided, or pass as strings if already serialized.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/importer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.sql src/lib/session.ts src/lib/importer.ts tests/importer.test.ts
git commit -m "feat(db): extend items schema and importer for use_cases and output_notes"
```

---

### Task 2: Telemetry Glossary & Metric Annotation Parser

**Files:**
- Create: `src/lib/telemetry-glossary.ts`
- Test: `tests/telemetry-glossary.test.ts`

**Interfaces:**
- `MetricDefinition`: `{ token: string; label: string; severity: 'info' | 'warning' | 'critical'; description: string; normalBaseline: string; anomalyAlert: string; }`
- `GLOBAL_TELEMETRY_GLOSSARY`: `Record<string, MetricDefinition>`
- `parseAnnotatedOutput(outputSample: string, customNotes?: string | null): { segments: Array<{ text: string; metricKey?: string; isAlert?: boolean }>; activeMetrics: Record<string, MetricDefinition> }`

- [ ] **Step 1: Write failing test for telemetry glossary and parser**

Create `tests/telemetry-glossary.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { parseAnnotatedOutput, GLOBAL_TELEMETRY_GLOSSARY } from '../src/lib/telemetry-glossary';

describe('Telemetry Glossary & Output Parser', () => {
  it('should recognize universal tokens like %CPU and STAT D in raw output', () => {
    const raw = 'USER PID %CPU STAT COMMAND\napp 3100 85.4 D java';
    const parsed = parseAnnotatedOutput(raw);

    expect(parsed.activeMetrics).toHaveProperty('stat_d');
    expect(parsed.activeMetrics.stat_d.label).toContain('Uninterruptible Sleep');
    const dSegment = parsed.segments.find(s => s.text === 'D');
    expect(dSegment?.metricKey).toBe('stat_d');
    expect(dSegment?.isAlert).toBe(true);
  });

  it('should allow customNotes to override and augment global glossary', () => {
    const raw = 'port2 192.168.10.1 nat: enable';
    const custom = JSON.stringify([
      { token: 'nat: enable', label: 'NAT Ativo', severity: 'info', description: 'Mascaramento de saída', normalBaseline: 'enable', anomalyAlert: 'disable' }
    ]);
    const parsed = parseAnnotatedOutput(raw, custom);
    expect(parsed.activeMetrics).toHaveProperty('nat_enable');
    expect(parsed.activeMetrics.nat_enable.label).toBe('NAT Ativo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/telemetry-glossary.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement telemetry-glossary.ts**

Create `src/lib/telemetry-glossary.ts` containing:
- Pre-populated dictionary for `%CPU`, `%MEM`, `RSS`, `TIME+`, `STAT D`, `STAT Z`, `STAT S`, `STAT R`, `wa%`, `Recv-Q`, `Send-Q`, `LISTEN`, `active-sessions`, `nat: enable`.
- `parseAnnotatedOutput` function using safe token splitting and regex escaping to slice text into plain text chunks and clickable hotspot tokens.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/telemetry-glossary.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/telemetry-glossary.ts tests/telemetry-glossary.test.ts
git commit -m "feat(telemetry): add global telemetry glossary and output token parser"
```

---

### Task 3: Embedded Linux Man Pages Engine & API

**Files:**
- Create: `src/data/man/` (package initial manpages: `ps`, `top`, `ss`, `ip`, `find`, `journalctl`, `systemctl`, `chmod`, `iptables`, `tcpdump`, `curl`, `vmstat`)
- Create: `src/lib/man-engine.ts`
- Create: `src/app/api/man/[cmd]/route.ts`
- Test: `tests/man-engine.test.ts`

**Interfaces:**
- `ManPage`: `{ command: string; title: string; sectionName: string; synopsis: string; description: string; options: string[]; examples: string[]; }`
- `getManPage(command: string): ManPage | null`
- `searchManPages(query: string): ManPage[]`

- [ ] **Step 1: Write failing test for man engine**

Create `tests/man-engine.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getManPage, searchManPages } from '../src/lib/man-engine';

describe('Embedded Man Engine', () => {
  it('should retrieve structured man page for ps', () => {
    const page = getManPage('ps');
    expect(page).not.toBeNull();
    expect(page?.command).toBe('ps');
    expect(page?.synopsis).toContain('ps');
    expect(page?.options.length).toBeGreaterThan(0);
  });

  it('should search man pages by query keyword', () => {
    const results = searchManPages('socket');
    expect(results.some(r => r.command === 'ss')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/man-engine.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement data packaging, man-engine.ts and API route**

Create `src/data/man/` with verified JSON entries for common Linux and network commands.
Implement `src/lib/man-engine.ts` with instant lookup and case-insensitive keyword filtering.
Create `src/app/api/man/[cmd]/route.ts` serving JSON with HTTP 200 / 404.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/man-engine.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/man/ src/lib/man-engine.ts src/app/api/man/[cmd]/route.ts tests/man-engine.test.ts
git commit -m "feat(man): add embedded linux man pages engine, dataset, and api route"
```

---

### Task 4: Standalone Man Portal (`/man` and `/man/[cmd]`)

**Files:**
- Create: `src/app/man/page.tsx`
- Create: `src/app/man/[cmd]/page.tsx`
- Modify: `src/components/TimerHeader.tsx` (add navigation link to `/man`)

**Interfaces:**
- `/man`: Full catalogue page with live client-side fuzzy filter and quick links.
- `/man/[cmd]`: Dedicated terminal reading page with dark console styling, section jumps, and "Treinar no NetDrill" action button.

- [ ] **Step 1: Implement catalogue page `/man`**

Create `src/app/man/page.tsx` with:
- Top search input `$ man [ comando ou termo ]`.
- Filterable cards of all bundled manuals.
- Header link back to `/` and `/import`.

- [ ] **Step 2: Implement manual viewer `/man/[cmd]`**

Create `src/app/man/[cmd]/page.tsx` with:
- Structured rendering of `NAME`, `SYNOPSIS`, `DESCRIPTION`, `OPTIONS`, `EXAMPLES`.
- Sticky sub-bar with shortcut keys and copy-to-clipboard for example snippets.
- Action button `[ Iniciar Treino com este Comando ]`.

- [ ] **Step 3: Verify build of new routes**

Run: `npm run build`
Expected: Routes `/man` and `/man/[cmd]` statically compiled cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/app/man/ src/components/TimerHeader.tsx
git commit -m "feat(man): add standalone manual catalogue and terminal reader pages"
```

---

### Task 5: Floating Terminal Man Modal Component (`ManModal.tsx`)

**Files:**
- Create: `src/components/ManModal.tsx`
- Test: `tests/man-modal.test.ts` (or component test)

**Interfaces:**
- `<ManModal isOpen={boolean} initialCommand={string} onClose={() => void} />`
- Keyboard listener: `Esc` or `q` triggers `onClose()`.
- Search bar: `$ man [ input ]` with instant switch between loaded commands.

- [ ] **Step 1: Create ManModal component**

Implement `src/components/ManModal.tsx` with:
- Dark semi-transparent backdrop (`bg-black/80 backdrop-blur-sm`).
- Terminal frame with `border-cyan-500/60` and JetBrains Mono typography.
- Command search bar pre-populated with `initialCommand`.
- Content area with scrollable `less` style formatting.
- `onKeyDown` handler intercepting `Escape` and `q`.

- [ ] **Step 2: Verify component lint and types**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ManModal.tsx
git commit -m "feat(ui): add floating terminal man modal with instant command search and less navigation"
```

---

### Task 6: Interactive Educational Workspace with Tabs & Auto-Pause Timer

**Files:**
- Modify: `src/components/StudySession.tsx`
- Modify: `src/components/TerminalPrompt.tsx`
- Modify: `src/components/MobileKeyboardBar.tsx`

**Interfaces:**
- `activeTab`: `'treino' | 'casos' | 'stdout'`
- Hotkeys: `Ctrl+1` (Treino), `Ctrl+2` (Casos), `Ctrl+3` (STDOUT), `M` / `Ctrl+M` (ManModal).
- `TerminalPrompt` intercepts `:man` or `:man <cmd>` to open `ManModal`.
- Timer freezes automatically with badge `[EM ESTUDO]` whenever `activeTab !== 'treino'` or `ManModal` is open.
- Auto-synthesis of incident scenario cards for items with null `use_cases`.

- [ ] **Step 1: Update StudySession with 3-tab workspace and telemetry inspector**

In `src/components/StudySession.tsx`:
- Add tab switch buttons `[ Ctrl+1 ] ⌨️ Treino`, `[ Ctrl+2 ] 💡 Casos de Uso`, `[ Ctrl+3 ] 🔍 STDOUT Anotado`.
- Integrate `parseAnnotatedOutput` in Tab 3 with active hotspot state and detailed inspection panel (meaning, baseline normal, anomaly alert).
- Add synthesis helper `getEffectiveUseCases(item)` ensuring legacy items render a structured scenario card.
- Add `isManOpen` state and render `<ManModal />`.
- Connect auto-pause logic: when tab is not `treino` or `isManOpen` is true, freeze countdown and display `[EM ESTUDO]`.

- [ ] **Step 2: Update TerminalPrompt and MobileKeyboardBar for inline :man invocation**

In `src/components/TerminalPrompt.tsx`:
- When input starts with `:man`, trigger `onOpenMan(cmd)`.
In `src/components/MobileKeyboardBar.tsx`:
- Add mobile tab dock or quick `📖 man` button.

- [ ] **Step 3: Run unit and session tests**

Run: `npx vitest run tests/session.test.ts tests/validator.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/StudySession.tsx src/components/TerminalPrompt.tsx src/components/MobileKeyboardBar.tsx
git commit -m "feat(study): integrate educational 3-tab workspace, metric inspection, man modal, and auto-pause timer"
```

---

### Task 7: End-to-End Verification, Portability & Impeccable Quality Gate

**Files:**
- Verify: Full repository working copy.

- [ ] **Step 1: Run comprehensive local quality gate**

Run: `make check`
Expected:
- Next.js lint: 0 warnings, 0 errors
- Vitest: all test files pass (100%)
- Gitleaks: 0 leaks
- Semgrep SAST: 0 issues
- Portability check: zero hardcoded local machine paths

- [ ] **Step 2: Run Impeccable detect on all modified UI surfaces**

Run: `npx -y impeccable detect src/`
Expected: 0 anti-patterns, 0 fatal warnings.

- [ ] **Step 3: Run Next.js production build**

Run: `npm run build`
Expected: All 13 routes compile cleanly.

- [ ] **Step 4: Commit and Push**

```bash
git push origin main
```
