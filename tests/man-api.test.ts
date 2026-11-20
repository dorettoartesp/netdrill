import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getCommand } from '../src/app/api/man/[cmd]/route';
import { GET as getCatalog } from '../src/app/api/man/route';
import { NextRequest } from 'next/server';
import * as dbModule from '../src/lib/db';
import * as nemotronModule from '../src/lib/nemotron-generator';
import { runMigrations } from '../src/lib/migrate';
import { upsertCachedManPage } from '../src/lib/man-db';

describe('Man API Route Handlers', () => {
  let db: ReturnType<typeof dbModule.getDbClient>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    db = dbModule.getDbClient(':memory:');
    vi.spyOn(dbModule, 'getDbClient').mockReturnValue(db);
    await runMigrations(db);
  });

  describe('GET /api/man (Catalogue)', () => {
    it('should return combined list of bundled and cached database manuals', async () => {
      await upsertCachedManPage(
        db,
        {
          command: 'rsync',
          title: 'rsync - fast copy',
          sectionName: '1 (Comandos)',
          synopsis: 'rsync [opts]',
          description: 'Sincronizador',
          options: ['-a : archive'],
          examples: ['rsync a b']
        },
        'ai_nemotron'
      );

      const res = await getCatalog();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
      expect(json.some((p: any) => p.command === 'ps')).toBe(true);
      expect(json.some((p: any) => p.command === 'rsync')).toBe(true);
    });
  });

  describe('GET /api/man/[cmd]', () => {
    it('should return 400 for invalid command names with special characters or whitespace', async () => {
      const req = new NextRequest('http://localhost/api/man/%20');
      const res = await getCommand(req, { params: { cmd: ' ' } });
      expect(res.status).toBe(400);

      const req2 = new NextRequest('http://localhost/api/man/bad;cmd');
      const res2 = await getCommand(req2, { params: { cmd: 'bad;cmd' } });
      expect(res2.status).toBe(400);
    });

    it('should immediately return bundled command ps with source: bundled', async () => {
      const req = new NextRequest('http://localhost/api/man/ps');
      const res = await getCommand(req, { params: { cmd: 'ps' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.command).toBe('ps');
      expect(json.source).toBe('bundled');
      expect(json.man7Url).toContain('man7.org');
    });

    it('should protect bundled commands from being overwritten by refresh=true', async () => {
      const req = new NextRequest('http://localhost/api/man/ps?refresh=true');
      const res = await getCommand(req, { params: { cmd: 'ps' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.source).toBe('bundled');
    });

    it('should return cached page from database if available without calling AI generator', async () => {
      await upsertCachedManPage(
        db,
        {
          command: 'rsync',
          title: 'rsync - fast copy',
          sectionName: '1 (Comandos)',
          synopsis: 'rsync [opts]',
          description: 'Sincronizador',
          options: ['-a : archive'],
          examples: ['rsync a b']
        },
        'ai_nemotron'
      );

      const generatorSpy = vi.spyOn(nemotronModule, 'generateManPageWithNemotron');
      const req = new NextRequest('http://localhost/api/man/rsync');
      const res = await getCommand(req, { params: { cmd: 'rsync' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.command).toBe('rsync');
      expect(json.source).toBe('ai_nemotron');
      expect(generatorSpy).not.toHaveBeenCalled();
    });

    it('should call generator on cache miss, persist result, and return 200', async () => {
      vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key');

      vi.spyOn(nemotronModule, 'generateManPageWithNemotron').mockResolvedValue({
        command: 'jq',
        title: 'jq - processador de JSON',
        sectionName: '1 (Comandos de Usuário)',
        synopsis: 'jq [opções] filtro',
        description: 'Processa e transforma streams JSON.',
        options: ['-r : raw output'],
        examples: ['cat a.json | jq .items'],
        source: 'ai_nemotron'
      });

      const req = new NextRequest('http://localhost/api/man/jq');
      const res = await getCommand(req, { params: { cmd: 'jq' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.command).toBe('jq');
      expect(json.source).toBe('ai_nemotron');

      // Verify it was persisted to DB
      const row = await db.execute({ sql: 'SELECT * FROM man_pages WHERE command = ?;', args: ['jq'] });
      expect(row.rows).toHaveLength(1);
    });

    it('should return 404 with man7Url and not persist when generator returns notFound: true', async () => {
      vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key');

      vi.spyOn(nemotronModule, 'generateManPageWithNemotron').mockResolvedValue({
        notFound: true
      });

      const req = new NextRequest('http://localhost/api/man/fakecmd123');
      const res = await getCommand(req, { params: { cmd: 'fakecmd123' } });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.man7Url).toContain('man7.org');

      // Verify NOT persisted
      const row = await db.execute({ sql: 'SELECT * FROM man_pages WHERE command = ?;', args: ['fakecmd123'] });
      expect(row.rows).toHaveLength(0);
    });

    it('should return 503 without leaking env var names when OPENROUTER_API_KEY is missing', async () => {
      delete process.env.OPENROUTER_API_KEY;
      const req = new NextRequest('http://localhost/api/man/strace');
      const res = await getCommand(req, { params: { cmd: 'strace' } });
      expect(res.status).toBe(503);
      const json = await res.json();
      expect(json.error).not.toContain('OPENROUTER_API_KEY');
      expect(json.error).toContain('Serviço de geração por IA temporariamente indisponível');
      expect(json.man7Url).toContain('man7.org');
    });
  });
});
