# NetDrill MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir e colocar online o MVP do NetDrill — plataforma web responsiva de fixação muscular de comandos e blocos de configuração (Linux, Redes, FortiGate) com repetição livre até `:done`, teste cego, timer diário, importação em lote (bulk JSON), Turso DB e deploy zero-touch na Vercel a partir do `agentic-tmpl`.

**Architecture:** Aplicação Next.js 14+ (App Router, TypeScript, Tailwind CSS) baseada na estrutura e Makefile adaptativo do `agentic-tmpl`. Conecta-se ao Turso DB via `@libsql/client` (com fallback para SQLite local em desenvolvimento/testes), implementa o algoritmo de agendamento SM-2 e validação linha a linha de comandos em terminal web responsivo com otimizações mobile.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Lucide React, `@libsql/client`, Vitest, Turso CLI, Vercel CLI, `agentic-tmpl`.

**Spec:** `/home/doretto/projects/agentic-tmpl/docs/superpowers/specs/2026-11-20-netdrill-design.md`

## Global Constraints

- **Template Base:** Inicializado via `scripts/init-project.sh` do `agentic-tmpl`.
- **Quality Gate:** Todos os passos devem passar no `make check` (lint, testes, SAST Semgrep, Gitleaks, portabilidade).
- **Zero-Touch Deploy:** Automação total via Turso CLI e Vercel CLI sem intervenção manual em painéis web.
- **Ambiente Mobile:** Teclado virtual com `autocorrect="off"`, `autocapitalize="none"`, `spellcheck="false"` e barra de atalhos rápidos (`-`, `_`, `/`, `|`, `Tab`, `:done`).
- **Escopo Estrito do MVP:** Foco 100% no core de treino muscular, timer, importação bulk e deploy online. Exportadores para Anki/Obsidian e modos extras de jogo são reservados para a Fase 2.

## Review Focus

1. **Quebras de Linha e Espaços no FortiOS:** Blocos multi-linha do FortiGate com indentação de 4 espaços ou `\r\n` não devem falhar por diferenças insignificantes de whitespace.
2. **Exaustão do Timer Durante Digitação:** O timer de sessão atingindo 00:00 durante uma repetição não deve abortar bruscamente a digitação do usuário, mas sim aguardar a conclusão da linha/bloco atual antes da tela de resumo.
3. **Persistência de Sessão Sem Internet (Offline/Local):** O cliente deve funcionar perfeitamente com arquivo SQLite local (`local.db`) quando variáveis de nuvem do Turso não estiverem presentes.
4. **Comando de Saída `:done` no Teste Cego:** Digitar `:done` durante o teste cego não deve ser aceito como resposta de gabarito.
5. **Payload de Importação em Lote Inválido:** O endpoint `/api/import` deve rejeitar JSON malformado ou campos obrigatórios ausentes com mensagens claras de erro antes de abrir transação no banco.

---

### Task 1: Bootstrap do Projeto a partir do `agentic-tmpl` e Scaffold Next.js

**Files:**
- Create: `/home/doretto/projects/netdrill/package.json`
- Create: `/home/doretto/projects/netdrill/tsconfig.json`
- Create: `/home/doretto/projects/netdrill/next.config.js`
- Create: `/home/doretto/projects/netdrill/tailwind.config.js`
- Create: `/home/doretto/projects/netdrill/postcss.config.js`
- Create: `/home/doretto/projects/netdrill/stack.mk`
- Modify: `/home/doretto/projects/netdrill/Makefile`
- Test: `/home/doretto/projects/netdrill/tests/health.test.ts`

**Interfaces:**
- Produces: Estrutura do repositório `netdrill` com scripts npm (`dev`, `build`, `test`, `lint`) e Makefile integrado ao `agentic-tmpl`.

- [ ] **Step 1: Executar o bootstrap wizard do template**
```bash
cd /home/doretto/projects/agentic-tmpl
bash scripts/init-project.sh --name "NetDrill" --slug "netdrill" --author "Doretto" --email "dev@doretto.local" --output "/home/doretto/projects/netdrill" --reset-git --non-interactive
```

- [ ] **Step 2: Inicializar dependências do Next.js, Tailwind e Vitest em `netdrill`**
Instalar dependências de runtime (`next`, `react`, `react-dom`, `@libsql/client`, `lucide-react`, `clsx`, `tailwind-merge`) e dev (`typescript`, `@types/react`, `@types/node`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`).

- [ ] **Step 3: Escrever teste de fumaça de infraestrutura em `tests/health.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';

describe('NetDrill Health Check', () => {
  it('should verify test environment is working', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 4: Executar `make check` em `netdrill` para validar o Quality Gate**
Run: `cd /home/doretto/projects/netdrill && make check`
Expected: PASS (clean exit 0)

- [ ] **Step 5: Commit inicial**
```bash
cd /home/doretto/projects/netdrill
git add .
git commit -m "chore: bootstrap netdrill project from agentic-tmpl with nextjs stack"
```

---

### Task 2: Camada de Dados Turso / libSQL e Migrações

**Files:**
- Create: `/home/doretto/projects/netdrill/src/lib/db.ts`
- Create: `/home/doretto/projects/netdrill/src/lib/schema.sql`
- Create: `/home/doretto/projects/netdrill/src/lib/migrate.ts`
- Test: `/home/doretto/projects/netdrill/tests/db.test.ts`

**Interfaces:**
- Produces: `getDbClient(): Client`, `runMigrations(db: Client): Promise<void>`
- Consumes: `@libsql/client`

- [ ] **Step 1: Escrever teste de migração e conexão com SQLite local**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';

describe('Database Layer', () => {
  it('should execute schema migrations and create required tables', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
    const tableNames = tables.rows.map(r => r.name);
    expect(tableNames).toContain('topics');
    expect(tableNames).toContain('modules');
    expect(tableNames).toContain('items');
    expect(tableNames).toContain('user_progress');
  });
});
```

- [ ] **Step 2: Executar teste para verificar falha**
Run: `npx vitest run tests/db.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implementar `src/lib/db.ts`, `src/lib/schema.sql` e `src/lib/migrate.ts`**
Criar `schema.sql` conforme especificado no Design Doc (tabelas `topics`, `modules`, `items`, `user_progress` e índices). Implementar fábrica de conexão que respeita `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` com fallback para `file:local.db`.

- [ ] **Step 4: Executar testes de banco**
Run: `npx vitest run tests/db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/ tests/db.test.ts
git commit -m "feat(db): implement libsql client connection and schema migrations"
```

---

### Task 3: Algoritmo SM-2 e Gerenciador de Sessão com Timer

**Files:**
- Create: `/home/doretto/projects/netdrill/src/lib/sm2.ts`
- Create: `/home/doretto/projects/netdrill/src/lib/session.ts`
- Test: `/home/doretto/projects/netdrill/tests/sm2.test.ts`
- Test: `/home/doretto/projects/netdrill/tests/session.test.ts`

**Interfaces:**
- Produces:
  - `calculateSM2(params: SM2Params): SM2Result`
  - `buildSessionQueue(db: Client, topicSlug?: string): Promise<QueueItem[]>`

- [ ] **Step 1: Escrever testes unitários do algoritmo SM-2**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateSM2 } from '../src/lib/sm2';

describe('SM-2 Algorithm', () => {
  it('should calculate first repetition with 1 day interval', () => {
    const result = calculateSM2({ repetitions: 0, intervalDays: 0, easeFactor: 2.5, grade: 5 });
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
  });

  it('should reset repetitions to 0 if grade is below 3', () => {
    const result = calculateSM2({ repetitions: 4, intervalDays: 14, easeFactor: 2.5, grade: 2 });
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
  });
});
```

- [ ] **Step 2: Executar testes de SM-2 para verificar falha**
Run: `npx vitest run tests/sm2.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar `src/lib/sm2.ts` e `src/lib/session.ts`**
Implementar a fórmula exata do SuperMemo-2 (cálculo de novo fator de facilidade $EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$, limite mínimo de $EF \ge 1.3$, intervalos para repetição 1, 2 e $n$). Implementar `buildSessionQueue` priorizando itens com `due_date <= now`, seguidos de itens não estudados.

- [ ] **Step 4: Executar testes de SM-2 e Sessão**
Run: `npx vitest run tests/sm2.test.ts tests/session.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/sm2.ts src/lib/session.ts tests/sm2.test.ts tests/session.test.ts
git commit -m "feat(study): implement sm2 spaced repetition and session queue builder"
```

---

### Task 4: Validador de Sintaxe e Motor do Free Drill

**Files:**
- Create: `/home/doretto/projects/netdrill/src/lib/validator.ts`
- Test: `/home/doretto/projects/netdrill/tests/validator.test.ts`

**Interfaces:**
- Produces:
  - `normalizeLine(line: string): string`
  - `compareBlock(inputLines: string[], targetBlock: string): { isMatch: boolean; mismatchLine?: number; diff?: string }`
  - `isExitCommand(input: string): boolean`

- [ ] **Step 1: Escrever testes do validador de sintaxe multi-linhas**
```typescript
import { describe, it, expect } from 'vitest';
import { compareBlock, isExitCommand } from '../src/lib/validator';

describe('Drill Validator', () => {
  it('should validate single-line command ignoring edge whitespaces', () => {
    const res = compareBlock(['  diagnose sys top 2 10  '], 'diagnose sys top 2 10');
    expect(res.isMatch).toBe(true);
  });

  it('should validate FortiOS multi-line hierarchical block', () => {
    const target = `config system interface\n    edit port2\n        set ip 10.0.0.1 255.255.255.0\n    next\nend`;
    const input = [
      'config system interface',
      'edit port2',
      'set ip 10.0.0.1 255.255.255.0',
      'next',
      'end'
    ];
    const res = compareBlock(input, target);
    expect(res.isMatch).toBe(true);
  });

  it('should detect exit command :done or pronto', () => {
    expect(isExitCommand(':done')).toBe(true);
    expect(isExitCommand('  :DONE ')).toBe(true);
    expect(isExitCommand('pronto')).toBe(true);
    expect(isExitCommand('config firewall')).toBe(false);
  });
});
```

- [ ] **Step 2: Executar testes para verificar falha**
Run: `npx vitest run tests/validator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar `src/lib/validator.ts`**
Normalizar quebras de linha (`\r\n` para `\n`), aparar espaços marginais, e comparar sequências de linhas tolerando variações normais de indentação.

- [ ] **Step 4: Executar testes de validação**
Run: `npx vitest run tests/validator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/validator.ts tests/validator.test.ts
git commit -m "feat(validator): implement line-by-line syntax validator and exit trigger"
```

---

### Task 5: Motor de Importação em Lote (Bulk JSON) e API

**Files:**
- Create: `/home/doretto/projects/netdrill/src/lib/importer.ts`
- Create: `/home/doretto/projects/netdrill/src/app/api/import/route.ts`
- Create: `/home/doretto/projects/netdrill/prompts/gerador-conteudo.md`
- Test: `/home/doretto/projects/netdrill/tests/importer.test.ts`

**Interfaces:**
- Produces: `importBulkData(db: Client, payload: BulkImportPayload): Promise<ImportResult>`
- Consumes: `src/lib/db.ts`

- [ ] **Step 1: Escrever teste de importação em lote com dados no schema oficial**
```typescript
import { describe, it, expect } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { importBulkData } from '../src/lib/importer';

describe('Bulk Importer', () => {
  it('should import new topic, module and items in a single transaction', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);

    const payload = {
      topic: 'fortigate',
      topic_title: 'Firewall FortiGate',
      module: 'firewall-policies',
      module_title: 'Políticas de Firewall',
      items: [
        {
          type: 'block',
          title: 'Liberar LAN para WAN com NAT',
          prompt: 'Configurar firewall policy liberando port2 para port1 com NAT',
          target: 'config firewall policy\nedit 1\nset action accept\nnext\nend',
          explanation: 'Habilita política de saída com NAT.'
        }
      ]
    };

    const result = await importBulkData(db, payload);
    expect(result.importedCount).toBe(1);

    const rows = await db.execute("SELECT count(*) as total FROM items WHERE type = 'block';");
    expect(rows.rows[0].total).toBe(1);
  });
});
```

- [ ] **Step 2: Executar teste para verificar falha**
Run: `npx vitest run tests/importer.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar `src/lib/importer.ts`, rota Next.js `/api/import` e template `prompts/gerador-conteudo.md`**
Validar schema com tipagem estrita, criar `topics` e `modules` idempotentemente se não existirem, inserir `items` e inicializar linha em `user_progress` com `due_date = CURRENT_TIMESTAMP`.

- [ ] **Step 4: Executar testes do importador**
Run: `npx vitest run tests/importer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/importer.ts src/app/api/import/ prompts/ tests/importer.test.ts
git commit -m "feat(import): implement bulk json importer and api endpoint"
```

---

### Task 6: Interface Web de Terminal Responsiva com Otimização Mobile

**Files:**
- Create: `/home/doretto/projects/netdrill/src/components/TerminalPrompt.tsx`
- Create: `/home/doretto/projects/netdrill/src/components/MobileKeyboardBar.tsx`
- Create: `/home/doretto/projects/netdrill/src/components/StudySession.tsx`
- Create: `/home/doretto/projects/netdrill/src/components/TimerHeader.tsx`
- Create: `/home/doretto/projects/netdrill/src/components/SummaryModal.tsx`
- Create: `/home/doretto/projects/netdrill/src/app/page.tsx`
- Create: `/home/doretto/projects/netdrill/src/app/import/page.tsx`
- Test: `/home/doretto/projects/netdrill/tests/ui.test.tsx`

**Interfaces:**
- Produces: Telas completas da aplicação Next.js (Dashboard de estudo, terminal interativo, tela de importação em lote).
- Consumes: `src/lib/validator.ts`, `src/lib/sm2.ts`, `src/lib/session.ts`

- [ ] **Step 1: Escrever teste de renderização dos componentes principais**
Verificar se o input do `TerminalPrompt` possui as propriedades móveis `autocorrect="off"`, `autocapitalize="none"`, `spellcheck="false"` e se os botões rápidos do `MobileKeyboardBar` emitem os eventos corretos de inserção de caracteres.

- [ ] **Step 2: Implementar os componentes de Terminal e Estudo**
  - Tema escuro estilo terminal com Tailwind.
  - Header com seletor de tempo (10, 15, 30 min) e contagem regressiva ativa.
  - Exibição de gabarito e explicação na fase de repetição livre.
  - Limpeza total de tela ao acionar `:done` para o Teste Cego.
  - Barra rápida no mobile: botões para `-`, `_`, `/`, `|`, `Tab`, `:done`.
  - Página `/import` com textarea para colar JSON, botão de preview e botão de gravação.

- [ ] **Step 3: Executar testes de UI**
Run: `npx vitest run tests/ui.test.tsx`
Expected: PASS

- [ ] **Step 4: Executar `make dev` e verificar no browser**
Executar build estático (`npm run build`) para garantir zero erros de compilação TypeScript/Next.js.

- [ ] **Step 5: Commit**
```bash
git add src/components/ src/app/ tests/ui.test.tsx
git commit -m "feat(ui): implement responsive terminal ui, mobile accessory bar and study flow"
```

---

### Task 7: Carga Inicial de Conteúdo (Linux, Redes e FortiGate)

**Files:**
- Create: `/home/doretto/projects/netdrill/src/data/seed-data.json`
- Create: `/home/doretto/projects/netdrill/scripts/seed.ts`
- Test: `/home/doretto/projects/netdrill/tests/seed.test.ts`

**Interfaces:**
- Produces: 30 itens reais de treino (10 Linux, 10 Redes, 10 FortiGate) prontos para uso imediato no banco.

- [ ] **Step 1: Escrever teste de validação do arquivo de seed**
Garantir que `src/data/seed-data.json` possui os 30 itens bem distribuídos nos 3 tópicos, com targets válidos e explicações detalhadas.

- [ ] **Step 2: Criar `seed-data.json` e script `seed.ts`**
  - Linux: `ss -tulpn`, `journalctl -u nginx -f`, `systemctl status`, `find /var/log -size +100M`, `chmod 600 ~/.ssh/id_rsa`, `tar -czvf`, `grep -E`, etc.
  - Redes: `ip route show`, `ip addr add 192.168.1.50/24 dev eth0`, `tcpdump -i eth0 -nn port 80`, `traceroute -n 8.8.8.8`, `ethtool eth0`, etc.
  - FortiGate (Comandos & Blocos): `diagnose sys top 2 10`, `get router info routing-table all`, bloco `config system interface ... set ip ... next end`, bloco `config firewall policy ... set action accept ... next end`, bloco `config router static ... set gateway ... next end`.

- [ ] **Step 3: Executar script de seed e validar banco populado**
Run: `npx ts-node scripts/seed.ts`
Expected: Inserção com sucesso dos 30 itens.

- [ ] **Step 4: Commit**
```bash
git add src/data/seed-data.json scripts/seed.ts tests/seed.test.ts
git commit -m "feat(seed): add fundamental 30-item curriculum for linux, networking and fortigate"
```

---

### Task 8: Qualidade Total (`make check`) e Deploy Automatizado Zero-Touch (CLI)

**Files:**
- Modify: `/home/doretto/projects/netdrill/Makefile`
- Modify: `/home/doretto/projects/netdrill/README.md`
- Create: `/home/doretto/projects/netdrill/scripts/deploy.sh`

**Interfaces:**
- Produces: Aplicação em produção na Vercel com Turso DB configurado e banco sincronizado.

- [ ] **Step 1: Rodar o Quality Gate completo do `agentic-tmpl`**
Run: `cd /home/doretto/projects/netdrill && make check`
Expected: PASS em todos os gates (lint, semgrep, gitleaks, testes, portabilidade).

- [ ] **Step 2: Automação Turso DB via CLI**
Criar banco de dados na nuvem Turso via CLI:
```bash
turso db create netdrill-prd || true
TURSO_URL=$(turso db show netdrill-prd --url)
TURSO_TOKEN=$(turso db tokens create netdrill-prd)
```
Executar as migrações e seed no banco remoto Turso.

- [ ] **Step 3: Automação Vercel Deploy via CLI**
Vincular e publicar o projeto na Vercel com as variáveis de ambiente necessárias:
```bash
vercel link --yes
vercel env add TURSO_DATABASE_URL production "$TURSO_URL"
vercel env add TURSO_AUTH_TOKEN production "$TURSO_TOKEN"
vercel --prod --yes
```

- [ ] **Step 4: Validação de Smoke Test da URL Online**
Fazer requisição curl à URL pública retornada pela Vercel e verificar status HTTP 200.

- [ ] **Step 5: Commit final de deploy**
```bash
git add .
git commit -m "chore: complete automated zero-touch deployment to vercel with turso db"
```
