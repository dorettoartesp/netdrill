import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getEntry } from '../src/app/api/man/[cmd]/route';
import { GET as getCatalog } from '../src/app/api/man/route';
import * as dbModule from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { importPack } from '../src/lib/content/importer';
import { linuxPack } from './fixtures/content';

describe('manual API', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    const db = dbModule.getDbClient(':memory:');
    vi.spyOn(dbModule, 'getDbClient').mockReturnValue(db);
    await runMigrations(db);
    await importPack(db, linuxPack());
  });

  it('GET /api/man lists documents and supports search', async () => {
    const res = await getCatalog(new NextRequest('http://localhost/api/man?q=ss'));
    expect(res.status).toBe(200);
    expect((await res.json()).map((d: any) => d.id)).toEqual(['linux.ss']);
  });

  it('GET /api/man/[id] returns the document without AI fields', async () => {
    const res = await getEntry(new NextRequest('http://localhost/api/man/linux.ss'), { params: { cmd: 'linux.ss' } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.body.name).toBe('ss');
    expect(json.usedBy.map((d: any) => d.id)).toEqual(['linux.oom']);
    expect(JSON.stringify(json)).not.toMatch(/nemotron|source/i);
  });

  it('GET /api/man/[id] returns 404 for unknown ids', async () => {
    const res = await getEntry(new NextRequest('http://localhost/api/man/linux.nope'), { params: { cmd: 'linux.nope' } });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'No manual entry found for this command.' });
  });
});
