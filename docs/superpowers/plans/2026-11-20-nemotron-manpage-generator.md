# Just-In-Time Linux Manpage Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable NetDrill to dynamically synthesize, format, and permanently cache Linux manual pages on-demand for any utility using OpenRouter's free `nvidia/nemotron-3.5-super-vl:free` model, backed by Turso libSQL storage, explicit user re-generation controls, and direct canonical links to `man7.org`.

**Architecture:** A three-tier manual lookup pipeline: (1) Instant local static bundle for 12 core commands; (2) Turso libSQL `man_pages` cache table for previously generated pages; (3) Asynchronous on-demand generation via OpenRouter Nemotron 3.5 Free. All views incorporate an immediate terminal loading shell to protect against Vercel serverless execution limits, an anti-hallucination guard against non-existent utilities, and direct external search links to `man7.org`.

**Tech Stack:** Next.js 14 App Router, TypeScript, React 18, Tailwind CSS, Turso libSQL / SQLite, OpenRouter API (`nvidia/nemotron-3.5-super-vl:free`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-20-nemotron-manpage-generator-design.md`

## Global Constraints

- Zero hardcoded local machine paths in tracked files (`make portability` gate).
- All user-facing UI copy and explanations strictly in formal Brazilian Portuguese (pt-BR).
- Monospace retro-terminal aesthetics conforming to `DESIGN.md` tokens (no AI slop, no side-tab anti-patterns, WCAG AA contrast $\ge 4.5:1$).
- `OPENROUTER_API_KEY` accessed server-side only; never leaked into client bundles.
- All code, docstrings, commits, and tests strictly in English.
- `make check` (lint, semgrep, gitleaks, vitest, portability) must pass before any commit.

## Review Focus

- **Markdown Fences in LLM JSON:** Nemotron wrapping valid JSON inside ````json ... ```` must be cleanly stripped before parsing.
- **Non-Existent Command Input:** Queries for arbitrary or hallucinated strings (e.g. `asdf123`) must trigger `notFound: true`, skip database insertion, and display the `man7.org` search fallback.
- **Vercel 10s Serverless Execution Ceiling:** Generation taking 15-20s must never block synchronous SSR; the UI must load the terminal shell immediately and query `/api/man/[cmd]` asynchronously.
- **Static vs. Dynamic Precedence:** Curated baseline manuals (`ps`, `top`, etc.) must remain immutable and never be overwritten by AI generation.
- **Missing or Expired `OPENROUTER_API_KEY`:** Graceful error handling returning a 503 status code and rendering a helpful terminal message with a direct `man7.org` link.

---

### Task 1: Database Schema & Cache Persistence Helpers

**Files:**
- Modify: `src/lib/schema.sql`
- Modify: `src/lib/migrate.ts`
- Create: `src/lib/man-db.ts`
- Test: `tests/man-db.test.ts`

**Interfaces:**
- `getCachedManPage(db: Client, command: string): Promise<ManPage | null>`
- `upsertCachedManPage(db: Client, page: ManPage, source?: string): Promise<void>`
- `listCachedManPages(db: Client): Promise<ManPage[]>`

- [ ] **Step 1: Write failing test for `man_pages` database persistence**

Create `tests/man-db.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getDbClient, initDb } from '../src/lib/db';
import { getCachedManPage, upsertCachedManPage, listCachedManPages } from '../src/lib/man-db';

describe('Man Pages Database Cache', () => {
  let db: ReturnType<typeof getDbClient>;

  beforeEach(async () => {
    db = getDbClient(':memory:');
    await initDb(db);
  });

  it('should return null when a command is not cached', async () => {
    const page = await getCachedManPage(db, 'rsync');
    expect(page).toBeNull();
  });

  it('should upsert and retrieve an AI-generated manpage', async () => {
    const mockPage = {
      command: 'rsync',
      title: 'rsync - ferramenta rápida de cópia e sincronização remota de arquivos',
      sectionName: '1 (Comandos de Usuário)',
      synopsis: 'rsync [opções] origem destino',
      description: 'O rsync sincroniza arquivos localmente ou através da rede.',
      options: ['-a : Modo arquivo preservando permissões e timestamps', '-v : Modo verboso'],
      examples: ['rsync -avz /dados/ user@servidor:/backup/'],
      source: 'ai_nemotron'
    };

    await upsertCachedManPage(db, mockPage, 'ai_nemotron');

    const cached = await getCachedManPage(db, 'rsync');
    expect(cached).not.toBeNull();
    expect(cached?.command).toBe('rsync');
    expect(cached?.options.length).toBe(2);
    expect(cached?.examples.length).toBe(1);
  });

  it('should list all cached manual pages ordered by command', async () => {
    await upsertCachedManPage(db, {
      command: 'strace',
      title: 'strace - rastreador de chamadas de sistema',
      sectionName: '1 (Comandos de Usuário)',
      synopsis: 'strace [opções] comando',
      description: 'Interrompe e rastreia syscalls executadas por um processo.',
      options: ['-p pid : Anexa a um processo em execução'],
      examples: ['strace -p 1234']
    });

    const pages = await listCachedManPages(db);
    expect(pages.some(p => p.command === 'strace')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/man-db.test.ts`
Expected: FAIL (`man-db` module not found)

- [ ] **Step 3: Implement database migration and cache helper functions**

In `src/lib/schema.sql` and `src/lib/migrate.ts`, add DDL:
```sql
CREATE TABLE IF NOT EXISTS man_pages (
  command TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  section_name TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  description TEXT NOT NULL,
  options TEXT NOT NULL,
  examples TEXT NOT NULL,
  source TEXT DEFAULT 'ai_nemotron',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```
Create `src/lib/man-db.ts` implementing `getCachedManPage`, `upsertCachedManPage`, and `listCachedManPages` with JSON parsing of `options` and `examples`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/man-db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/schema.sql src/lib/migrate.ts src/lib/man-db.ts tests/man-db.test.ts
git commit -m "feat(db): add man_pages cache table and persistence helpers"
```

---

### Task 2: OpenRouter Nemotron JIT Generator Service

**Files:**
- Create: `src/lib/nemotron-generator.ts`
- Test: `tests/nemotron-generator.test.ts`

**Interfaces:**
- `generateManPageWithNemotron(command: string, apiKey?: string): Promise<ManPage | { notFound: true }>`
- `extractJsonFromResponse(rawContent: string): unknown`

- [ ] **Step 1: Write failing test for Nemotron generation and parsing**

Create `tests/nemotron-generator.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateManPageWithNemotron, extractJsonFromResponse } from '../src/lib/nemotron-generator';

describe('OpenRouter Nemotron JIT Generator', () => {
  it('should cleanly strip markdown fences from raw LLM output', () => {
    const raw = '```json\n{\n  "command": "jq",\n  "title": "jq - processador de JSON",\n  "sectionName": "1 (Comandos de Usuário)",\n  "synopsis": "jq [opções] filtro [arquivo...]",\n  "description": "Filtra e transforma streams JSON.",\n  "options": ["-r : Saída em texto puro"],\n  "examples": ["cat dados.json | jq .items"]\n}\n```';
    const parsed = extractJsonFromResponse(raw) as any;
    expect(parsed.command).toBe('jq');
    expect(parsed.options).toHaveLength(1);
  });

  it('should detect when LLM returns notFound: true for invalid commands', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ notFound: true, error: 'Comando inexistente no Linux' })
            }
          }
        ]
      })
    });
    global.fetch = mockFetch;

    const result = await generateManPageWithNemotron('fakeasdf123', 'fake-key');
    expect(result).toEqual({ notFound: true });
  });

  it('should throw an error if API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(generateManPageWithNemotron('rsync', '')).rejects.toThrow('OPENROUTER_API_KEY');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/nemotron-generator.test.ts`
Expected: FAIL (`nemotron-generator` not found)

- [ ] **Step 3: Implement `src/lib/nemotron-generator.ts`**

Implement:
- `OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'`
- `NEMOTRON_MODEL = 'nvidia/nemotron-3.5-super-vl:free'`
- System Prompt with strict JSON schema instructions and anti-hallucination requirement (`return {"notFound": true}` for non-existent utilities).
- Robust markdown fence stripping regex: `content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()`.
- Timeout handling using `AbortController` (25 seconds).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/nemotron-generator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/nemotron-generator.ts tests/nemotron-generator.test.ts
git commit -m "feat(ai): add openrouter nemotron manual page generator service"
```

---

### Task 3: Dynamic `/api/man/[cmd]` Route with Cache & Regeneration

**Files:**
- Modify: `src/app/api/man/[cmd]/route.ts`
- Test: `tests/man-api.test.ts`

**Interfaces:**
- `GET /api/man/[cmd]?refresh=true|false`
- Returns: `200 ManPage` (with `source: 'bundled' | 'ai_nemotron'`), `404 Not Found` (with `man7Url`), or `503 Service Unavailable`.

- [ ] **Step 1: Write failing test for `/api/man/[cmd]`**

Create `tests/man-api.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../src/app/api/man/[cmd]/route';
import { NextRequest } from 'next/server';
import { getDbClient, initDb } from '../src/lib/db';

describe('Man API Route Handler', () => {
  beforeEach(async () => {
    const db = getDbClient(':memory:');
    await initDb(db);
  });

  it('should immediately return bundled command ps without querying database or AI', async () => {
    const req = new NextRequest('http://localhost/api/man/ps');
    const res = await GET(req, { params: { cmd: 'ps' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.command).toBe('ps');
    expect(json.source).toBe('bundled');
  });

  it('should protect bundled commands from being overwritten by refresh=true', async () => {
    const req = new NextRequest('http://localhost/api/man/ps?refresh=true');
    const res = await GET(req, { params: { cmd: 'ps' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.source).toBe('bundled');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/man-api.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `src/app/api/man/[cmd]/route.ts`**

Implement pipeline:
1. `const isRefresh = req.nextUrl.searchParams.get('refresh') === 'true';`
2. Check `getManPage(cmd)`. If present in bundled static, always return 200 with `source: 'bundled'`.
3. If `!isRefresh`, query `getCachedManPage(db, cleanCmd)`. If found, return 200 with `source: 'ai_nemotron'`.
4. If cache miss or `isRefresh === true`:
   - Check if `process.env.OPENROUTER_API_KEY` is present.
   - Call `generateManPageWithNemotron(cleanCmd)`.
   - If `notFound: true`, return 404 with `{ error: 'Comando desconhecido', man7Url: 'https://www.google.com/search?q=${cmd}+site:man7.org/linux/man-pages' }`.
   - If generated successfully, save with `upsertCachedManPage(db, page, 'ai_nemotron')` and return 200.
   - If error/timeout occurs, return 503 with error message and `man7Url`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/man-api.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/man/[cmd]/route.ts tests/man-api.test.ts
git commit -m "feat(api): integrate cache lookup, nemotron generator, and man7 fallback in man route"
```

---

### Task 4: Floating Terminal `ManModal` with JIT Loading & man7.org Links

**Files:**
- Modify: `src/components/ManModal.tsx`

**Interfaces:**
- Modal states: `'idle' | 'loading' | 'ready' | 'error' | 'not_found'`
- Timer hook tracking elapsed seconds while generating.
- Canonical escape link: `https://www.google.com/search?q=${encodeURIComponent(activeCmd + ' site:man7.org/linux/man-pages')}` in `target="_blank"`.

- [ ] **Step 1: Update `ManModal.tsx` with asynchronous JIT loading and canonical links**

In `src/components/ManModal.tsx`:
- Add `isLoading`, `elapsedSeconds`, and `errorState`.
- When user searches a command:
  1. Check static `getManPage(cmd)`. If found, display immediately with 0 latency.
  2. If not static, set `isLoading = true` and call `/api/man/${cmd}`.
- Render retro-terminal spinner while loading:
  ```text
  $ man strace
  [ ⏳ Consultando Nemotron AI e indexando manual para 'strace' (00:04s)... ]
  [ 💡 Esse processo ocorre apenas uma vez. As próximas consultas serão instantâneas. ]
  ```
- Render badge `[ 🤖 Gerado por IA (Nemotron) ]` when `source === 'ai_nemotron'`.
- Render `[ 🔄 Regenerar ]` button when `source === 'ai_nemotron'`.
- Add link `[ 🌐 Ver no man7.org original ↗ ]` in the title bar, footer, and not-found view.

- [ ] **Step 2: Verify component lint and types**

Run: `npm run lint`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ManModal.tsx
git commit -m "feat(ui): add jit loading spinner, ai badge, regeneration button, and man7 links to man modal"
```

---

### Task 5: Standalone Portal (`/man` and `/man/[cmd]`) with JIT Trigger

**Files:**
- Modify: `src/app/man/page.tsx`
- Modify: `src/app/man/[cmd]/page.tsx`

- [ ] **Step 1: Update Catalogue `/man` to show cached pages and JIT trigger**

In `src/app/man/page.tsx`:
- Fetch cached pages from database via `/api/man` or direct DB helper.
- When search query matches nothing in bundled or cached list, display:
  ```text
  [ 🤖 Gerar Manual para "${searchQuery}" via Nemotron AI ]
  [ 🌐 Buscar "${searchQuery}" no man7.org via Google ↗ ]
  ```
- Clicking "Gerar Manual" navigates to `/man/${searchQuery}`.

- [ ] **Step 2: Update Reader `/man/[cmd]` with client-side async shell**

In `src/app/man/[cmd]/page.tsx`:
- Render terminal shell immediately (preventing Vercel 10s SSR timeout).
- Fetch manual from `/api/man/[cmd]` on client mount.
- Show `[ 🔄 Regenerar ]` button for AI-generated commands.
- Provide `[ 🌐 man7.org ↗ ]` action button in header.

- [ ] **Step 3: Verify build of Next.js routes**

Run: `npm run build`
Expected: Build passes with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/man/page.tsx src/app/man/[cmd]/page.tsx
git commit -m "feat(man): add jit generation trigger to catalogue and async shell to reader"
```

---

### Task 6: End-to-End Verification, Portability & Production Deployment

**Files:**
- Full repository verification.

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
Expected: 0 anti-patterns (Exit code 0).

- [ ] **Step 3: Run Next.js production build**

Run: `npm run build`
Expected: Clean static and dynamic compilation.

- [ ] **Step 4: Push to origin/main and Deploy to Vercel**

```bash
git push origin main
npx -y vercel --prod --yes
```

- [ ] **Step 5: Smoke test live production manual generation**

Verify HTTP 200 response on `https://netdrill-nine.vercel.app/man` and test API route:
```bash
curl -s -L -o /dev/null -w "%{http_code}\n" https://netdrill-nine.vercel.app/api/man/ps
```
