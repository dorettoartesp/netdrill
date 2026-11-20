import { describe, it, expect } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { importPack } from '../src/lib/content/importer';
import { buildSessionQueue, getAvailableTopics, toMetricNotes } from '../src/lib/session';
import { linuxPack } from './fixtures/content';

async function seededDb() {
  const db = getDbClient(':memory:');
  await runMigrations(db);
  await importPack(db, linuxPack());
  await importPack(db, {
    format: 'netdrill.pack/v1',
    topic: { slug: 'redes', title: 'Networking' },
    commands: [{ id: 'redes.ping', name: 'ping', summary: 's', synopsis: 'ping host', description: 'd',
      examples: [{ id: 'basic', title: 'Ping', scenario: 'Ping a host.', command: 'ping -c 3 localhost' }] }],
  });
  return db;
}

describe('buildSessionQueue', () => {
  it('puts due drills first, then never-reviewed ones', async () => {
    const db = await seededDb();
    const future = new Date(Date.now() + 5 * 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    await db.execute({ sql: "UPDATE progress SET due_date = ?, total_drilled_count = 1 WHERE drill_id != 'linux.oom';", args: [future] });
    await db.execute({ sql: "UPDATE progress SET due_date = ?, total_drilled_count = 1 WHERE drill_id = 'linux.oom';", args: [past] });
    const queue = await buildSessionQueue(db, ['linux']);
    expect(queue[0].id).toBe('linux.oom');
    expect(queue[0].isDue).toBe(true);
    expect(queue.slice(1).every((q) => !q.isDue)).toBe(true);
  });

  it('filters by topic slugs', async () => {
    const db = await seededDb();
    expect((await buildSessionQueue(db, ['redes'])).map((q) => q.id)).toEqual(['redes.ping#basic']);
    expect(await buildSessionQueue(db)).toHaveLength(4);
  });

  it('maps example drills from their command document', async () => {
    const db = await seededDb();
    const item = (await buildSessionQueue(db, ['linux'])).find((q) => q.id === 'linux.ss#listening')!;
    expect(item).toMatchObject({
      documentId: 'linux.ss',
      kind: 'example',
      title: 'Listening sockets',
      prompt: 'List listening sockets with process.',
      target: 'ss -tulpn',
      isMultiLine: false,
      is_favorite: false,
      needs_review: false,
    });
    expect(item.use_cases.map((u) => u.title)).toEqual(['Port down after deploy']);
    expect(item.output_notes).toEqual([]);
  });

  it('maps procedures as multi-line drills', async () => {
    const db = await seededDb();
    const item = (await buildSessionQueue(db, ['linux'])).find((q) => q.id === 'linux.oom')!;
    expect(item).toMatchObject({ kind: 'procedure', isMultiLine: true, target: 'cat memory.current\ngrep oom memory.events' });
  });

  it('exposes favorite and review flags', async () => {
    const db = await seededDb();
    await db.execute("UPDATE progress SET is_favorite = 1, needs_review = 1 WHERE drill_id = 'redes.ping#basic';");
    const [item] = await buildSessionQueue(db, ['redes']);
    expect(item.is_favorite).toBe(true);
    expect(item.needs_review).toBe(true);
  });
});

describe('getAvailableTopics', () => {
  it('counts drills and due drills per topic', async () => {
    const db = await seededDb();
    const future = new Date(Date.now() + 86400000).toISOString();
    await db.execute({ sql: "UPDATE progress SET due_date = ? WHERE drill_id = 'linux.oom';", args: [future] });
    const topics = await getAvailableTopics(db);
    expect(topics).toEqual([
      { id: 'linux', slug: 'linux', title: 'Linux Administration', description: 'Processes and sockets', itemCount: 3, dueCount: 2 },
      { id: 'redes', slug: 'redes', title: 'Networking', description: undefined, itemCount: 1, dueCount: 1 },
    ]);
  });
});

describe('toMetricNotes', () => {
  it('maps output notes onto telemetry glossary definitions', () => {
    expect(toMetricNotes([{ token: 'Recv-Q', meaning: 'Queue', normal: '0', anomaly: 'High', severity: 'warning' }])).toEqual([
      { token: 'Recv-Q', label: 'Recv-Q', description: 'Queue', normalBaseline: '0', anomalyAlert: 'High', severity: 'warning' },
    ]);
  });

  it('fills missing baselines with a dash', () => {
    expect(toMetricNotes([{ token: 'X', meaning: 'm', severity: 'info' }])[0]).toMatchObject({ normalBaseline: '—', anomalyAlert: '—' });
  });
});
