import { describe, it, expect, beforeEach } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { buildSessionQueue } from '../src/lib/session';

// Skipped: legacy schema; replaced in Tasks 5–7 of the command-centric content plan.
describe.skip('Session Queue Builder', () => {
  it('should prioritize overdue items over unreviewed items', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);

    // Insert topic and module
    await db.execute("INSERT INTO topics (id, slug, title) VALUES ('t1', 'linux', 'Linux');");
    await db.execute("INSERT INTO modules (id, topic_id, slug, title) VALUES ('m1', 't1', 'basics', 'Basics');");

    // Insert 2 items
    await db.execute("INSERT INTO items (id, module_id, type, title, prompt, target) VALUES ('i1', 'm1', 'command', 'Cmd1', 'Prompt1', 'target1');");
    await db.execute("INSERT INTO items (id, module_id, type, title, prompt, target) VALUES ('i2', 'm1', 'command', 'Cmd2', 'Prompt2', 'target2');");

    // i1 is overdue (due yesterday), i2 has no progress yet (new)
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    await db.execute({
      sql: "INSERT INTO user_progress (id, item_id, repetitions, interval_days, ease_factor, due_date) VALUES ('p1', 'i1', 1, 1, 2.5, ?);",
      args: [yesterday]
    });

    const queue = await buildSessionQueue(db);
    expect(queue.length).toBe(2);
    expect(queue[0].id).toBe('i1'); // Due item comes first!
    expect(queue[1].id).toBe('i2'); // New item comes next
  });

  it('should filter queue by multiple selected topic slugs', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);

    await db.execute("INSERT INTO topics (id, slug, title) VALUES ('t1', 'linux', 'Linux'), ('t2', 'redes', 'Redes'), ('t3', 'fortigate', 'FortiGate');");
    await db.execute("INSERT INTO modules (id, topic_id, slug, title) VALUES ('m1', 't1', 'm1', 'M1'), ('m2', 't2', 'm2', 'M2'), ('m3', 't3', 'm3', 'M3');");
    await db.execute("INSERT INTO items (id, module_id, type, title, prompt, target) VALUES ('i1', 'm1', 'command', 'Linux Cmd', 'p', 't'), ('i2', 'm2', 'command', 'Redes Cmd', 'p', 't'), ('i3', 'm3', 'command', 'FortiGate Cmd', 'p', 't');");

    const filtered = await buildSessionQueue(db, ['linux', 'fortigate']);
    expect(filtered.length).toBe(2);
    const titles = filtered.map((i) => i.title);
    expect(titles).toContain('Linux Cmd');
    expect(titles).toContain('FortiGate Cmd');
    expect(titles).not.toContain('Redes Cmd');
  });

  it('should return available topics with item and due counts', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);

    await db.execute("INSERT INTO topics (id, slug, title) VALUES ('t1', 'linux', 'Linux'), ('t2', 'redes', 'Redes');");
    await db.execute("INSERT INTO modules (id, topic_id, slug, title) VALUES ('m1', 't1', 'm1', 'M1'), ('m2', 't2', 'm2', 'M2');");
    await db.execute("INSERT INTO items (id, module_id, type, title, prompt, target) VALUES ('i1', 'm1', 'command', 'Linux 1', 'p', 't'), ('i2', 'm1', 'command', 'Linux 2', 'p', 't'), ('i3', 'm2', 'command', 'Redes 1', 'p', 't');");

    // @ts-ignore
    const { getAvailableTopics } = await import('../src/lib/session');
    const topics = await getAvailableTopics(db);
    expect(topics.length).toBe(2);

    const linux = topics.find((t: any) => t.slug === 'linux');
    expect(linux?.itemCount).toBe(2);

    const redes = topics.find((t: any) => t.slug === 'redes');
    expect(redes?.itemCount).toBe(1);
  });
});
