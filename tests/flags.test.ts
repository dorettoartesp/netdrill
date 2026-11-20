import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as dbModule from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { importPack } from '../src/lib/content/importer';
import { POST as postFlag } from '../src/app/api/progress/flag/route';
import { POST as postProgress } from '../src/app/api/progress/route';
import { linuxPack } from './fixtures/content';

const json = (url: string, body: unknown) =>
  new NextRequest(url, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });

describe('progress APIs', () => {
  let db: ReturnType<typeof dbModule.getDbClient>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    db = dbModule.getDbClient(':memory:');
    vi.spyOn(dbModule, 'getDbClient').mockReturnValue(db);
    await runMigrations(db);
    await importPack(db, linuxPack());
  });

  it('stores favorite and needs-review flags by drillId', async () => {
    const res = await postFlag(json('http://localhost/api/progress/flag', { drillId: 'linux.oom', isFavorite: true, needsReview: true }));
    expect(res.status).toBe(200);
    const row = (await db.execute("SELECT is_favorite, needs_review FROM progress WHERE drill_id = 'linux.oom';")).rows[0];
    expect(Number(row.is_favorite)).toBe(1);
    expect(Number(row.needs_review)).toBe(1);
  });

  it('requires drillId for flags', async () => {
    const res = await postFlag(json('http://localhost/api/progress/flag', { isFavorite: true }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'drillId is required.' });
  });

  it('upserts SM-2 values for drillId', async () => {
    const res = await postProgress(json('http://localhost/api/progress', { drillId: 'linux.oom', grade: 5 }));
    expect(res.status).toBe(200);
    const row = (await db.execute("SELECT repetitions, total_drilled_count, due_date FROM progress WHERE drill_id = 'linux.oom';")).rows[0];
    expect(Number(row.repetitions)).toBe(1);
    expect(Number(row.total_drilled_count)).toBe(1);
    expect(Date.parse(String(row.due_date))).toBeGreaterThan(Date.now());
  });

  it('requires drillId for progress', async () => {
    const res = await postProgress(json('http://localhost/api/progress', { grade: 5 }));
    expect(res.status).toBe(400);
  });
});
