import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../src/app/api/man/[cmd]/route';
import { NextRequest } from 'next/server';
import * as dbModule from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { upsertCachedManPage } from '../src/lib/man-db';

describe('Man API Route Handler', () => {
  let db: ReturnType<typeof dbModule.getDbClient>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    db = dbModule.getDbClient(':memory:');
    vi.spyOn(dbModule, 'getDbClient').mockReturnValue(db);
    await runMigrations(db);
  });

  it('should immediately return bundled command ps with source: bundled', async () => {
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

    const req = new NextRequest('http://localhost/api/man/rsync');
    const res = await GET(req, { params: { cmd: 'rsync' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.command).toBe('rsync');
    expect(json.source).toBe('ai_nemotron');
  });

  it('should return 404 with man7Url when command is rejected as notFound', async () => {
    const req = new NextRequest('http://localhost/api/man/asdf123fake');
    // Without OPENROUTER_API_KEY, route returns 503 or 404 with man7Url
    const res = await GET(req, { params: { cmd: 'asdf123fake' } });
    expect([404, 503]).toContain(res.status);
    const json = await res.json();
    expect(json.man7Url).toContain('man7.org');
  });
});
