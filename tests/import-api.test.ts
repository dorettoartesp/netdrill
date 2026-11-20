import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/import/route';
import * as dbModule from '../src/lib/db';
import { linuxPack } from './fixtures/content';

function req(body: string, query = '') {
  return new NextRequest(`http://localhost/api/import${query}`, {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/import', () => {
  let db: ReturnType<typeof dbModule.getDbClient>;

  beforeEach(() => {
    vi.restoreAllMocks();
    db = dbModule.getDbClient(':memory:');
    vi.spyOn(dbModule, 'getDbClient').mockReturnValue(db);
  });

  async function documentCount() {
    const rs = await db.execute('SELECT COUNT(*) AS n FROM documents;');
    return Number(rs.rows[0].n);
  }

  it('imports a valid pack', async () => {
    const res = await POST(req(JSON.stringify(linuxPack())));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, dryRun: false, summary: { documentsCreated: 2 } });
    expect(await documentCount()).toBe(2);
  });

  it('validates without writing on dryRun', async () => {
    const res = await POST(req(JSON.stringify(linuxPack()), '?dryRun=true'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, dryRun: true });
    expect(await documentCount()).toBe(0);
  });

  it('rejects text that is not JSON', async () => {
    const res = await POST(req('not json'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, issues: [{ path: '', message: 'The file is not valid JSON.' }] });
  });

  it('rejects JSON that is not a pack object', async () => {
    for (const body of ['[]', '"x"']) {
      const res = await POST(req(body));
      expect(res.status).toBe(400);
      expect((await res.json()).issues[0]).toEqual({ path: '', message: 'Expected a pack object.' });
    }
  });

  it('returns validation issues with 400', async () => {
    const p = linuxPack();
    delete p.topic.title;
    const res = await POST(req(JSON.stringify(p)));
    expect(res.status).toBe(400);
    expect((await res.json()).issues[0].path).toBe('topic.title');
  });

  it('rejects bodies over 2 MB', async () => {
    const res = await POST(req('x'.repeat(2 * 1024 * 1024 + 1)));
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ ok: false, issues: [{ path: '', message: 'The file exceeds the 2 MB limit.' }] });
  });
});
