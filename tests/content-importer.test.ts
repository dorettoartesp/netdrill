import { describe, it, expect, vi } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { importPack } from '../src/lib/content/importer';
import { linuxPack } from './fixtures/content';

async function freshDb() {
  const db = getDbClient(':memory:');
  await runMigrations(db);
  return db;
}

async function count(db: ReturnType<typeof getDbClient>, table: string): Promise<number> {
  const rs = await db.execute(`SELECT COUNT(*) AS n FROM ${table};`);
  return Number(rs.rows[0].n);
}

describe('importPack', () => {
  it('imports a pack', async () => {
    const db = await freshDb();
    const r = await importPack(db, linuxPack());
    expect(r).toMatchObject({
      ok: true,
      dryRun: false,
      summary: { documentsCreated: 2, documentsUpdated: 0, documentsRemoved: 0, drillsCreated: 3, drillsRemoved: 0 },
    });
    expect(await count(db, 'drills')).toBe(3);
    const due = await db.execute('SELECT due_date FROM progress;');
    expect(due.rows).toHaveLength(3);
    for (const row of due.rows) expect(Date.parse(String(row.due_date))).toBeLessThanOrEqual(Date.now());
    const doc = await db.execute("SELECT kind, topic_slug, name FROM documents WHERE id = 'linux.oom';");
    expect(doc.rows[0]).toMatchObject({ kind: 'procedure', topic_slug: 'linux', name: 'OOM triage' });
  });

  it('reimport is idempotent and keeps progress', async () => {
    const db = await freshDb();
    await importPack(db, linuxPack());
    await db.execute("UPDATE progress SET repetitions = 3 WHERE drill_id = 'linux.ss#listening';");
    const r = await importPack(db, linuxPack());
    expect(r).toMatchObject({ ok: true, summary: { documentsCreated: 0, documentsUpdated: 2, drillsCreated: 0, drillsRemoved: 0 } });
    expect(await count(db, 'documents')).toBe(2);
    expect(await count(db, 'drills')).toBe(3);
    expect(await count(db, 'progress')).toBe(3);
    const rep = await db.execute("SELECT repetitions FROM progress WHERE drill_id = 'linux.ss#listening';");
    expect(Number(rep.rows[0].repetitions)).toBe(3);
  });

  it('dropped example removes its drill and progress only', async () => {
    const db = await freshDb();
    await importPack(db, linuxPack());
    await db.execute("UPDATE progress SET repetitions = 2 WHERE drill_id = 'linux.ss#listening';");
    const p = linuxPack();
    p.commands[0].examples = p.commands[0].examples.filter((e: any) => e.id !== 'summary');
    const r = await importPack(db, p);
    expect(r).toMatchObject({ ok: true, summary: { drillsRemoved: 1 } });
    const ids = (await db.execute('SELECT drill_id FROM progress ORDER BY drill_id;')).rows.map((x) => x.drill_id);
    expect(ids).toEqual(['linux.oom', 'linux.ss#listening']);
    const rep = await db.execute("SELECT repetitions FROM progress WHERE drill_id = 'linux.ss#listening';");
    expect(Number(rep.rows[0].repetitions)).toBe(2);
  });

  it('remove deletes documents of this topic', async () => {
    const db = await freshDb();
    await importPack(db, linuxPack());
    const r = await importPack(db, { format: 'netdrill.pack/v1', topic: { slug: 'linux', title: 'Linux' }, remove: ['linux.oom'] });
    expect(r).toMatchObject({ ok: true, summary: { documentsRemoved: 1, drillsRemoved: 1 } });
    expect(await count(db, 'documents')).toBe(1);
    expect(await count(db, 'progress')).toBe(2);
    expect(await count(db, 'document_links')).toBe(0);
  });

  it('rejects remove ids from another topic', async () => {
    const db = await freshDb();
    await importPack(db, linuxPack());
    const r = await importPack(db, { format: 'netdrill.pack/v1', topic: { slug: 'redes', title: 'Redes' }, remove: ['linux.oom'] });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.issues[0].path).toBe('remove[0]');
    expect(await count(db, 'documents')).toBe(2);
  });

  it('rejects an id stored under another kind', async () => {
    const db = await freshDb();
    await importPack(db, linuxPack());
    const p = linuxPack();
    p.procedures[0].id = 'linux.ss';
    p.commands = [];
    const r = await importPack(db, p);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.issues.map((i) => i.path)).toContain('procedures[0].id');
  });

  it('dryRun writes nothing', async () => {
    const db = await freshDb();
    const r = await importPack(db, linuxPack(), { dryRun: true });
    expect(r).toMatchObject({ ok: true, dryRun: true, summary: { documentsCreated: 2, drillsCreated: 3 } });
    expect(await count(db, 'documents')).toBe(0);
    expect(await count(db, 'topics')).toBe(0);
  });

  it('warns about unresolved uses/related ids', async () => {
    const db = await freshDb();
    const r = await importPack(db, linuxPack());
    expect(r.ok && r.warnings).toEqual([
      { path: 'procedures[0].uses[1]', message: 'Command "linux.grep" is not uploaded yet; the link activates once it is.' },
    ]);
  });

  it('resolves references to commands already stored', async () => {
    const db = await freshDb();
    await importPack(db, {
      format: 'netdrill.pack/v1',
      topic: { slug: 'linux', title: 'Linux' },
      commands: [{ id: 'linux.grep', name: 'grep', summary: 's', synopsis: 'grep', description: 'd' }],
    });
    const r = await importPack(db, linuxPack());
    expect(r.ok && r.warnings).toEqual([]);
  });

  it('returns validation issues without writing', async () => {
    const db = await freshDb();
    const p = linuxPack();
    delete p.commands[0].name;
    const r = await importPack(db, p);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.issues[0].path).toBe('commands[0].name');
    expect(await count(db, 'documents')).toBe(0);
  });

  it('hides database errors', async () => {
    const db = await freshDb();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    db.close();
    const r = await importPack(db, linuxPack());
    expect(r).toEqual({ ok: false, issues: [{ path: '', message: 'The import could not be completed. Please try again.' }] });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
