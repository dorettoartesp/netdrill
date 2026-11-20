import { describe, it, expect, beforeEach } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { buildSessionQueue } from '../src/lib/session';

describe('Session Queue Builder', () => {
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
});
