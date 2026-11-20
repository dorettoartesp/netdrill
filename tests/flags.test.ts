import { describe, it, expect } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { buildSessionQueue } from '../src/lib/session';

describe('Item Favoriting and Review Flagging', () => {
  it('should store and retrieve is_favorite and needs_review flags', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);

    await db.execute("INSERT INTO topics (id, slug, title) VALUES ('t1', 'linux', 'Linux');");
    await db.execute("INSERT INTO modules (id, topic_id, slug, title) VALUES ('m1', 't1', 'm1', 'M1');");
    await db.execute("INSERT INTO items (id, module_id, type, title, prompt, target) VALUES ('i1', 'm1', 'command', 'Cmd1', 'p1', 't1');");

    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO user_progress (id, item_id, repetitions, interval_days, ease_factor, due_date, is_favorite, needs_review)
            VALUES ('p1', 'i1', 0, 0, 2.5, ?, 1, 1);`,
      args: [now],
    });

    const queue = await buildSessionQueue(db);
    expect(queue.length).toBe(1);
    expect(queue[0].is_favorite).toBe(true);
    expect(queue[0].needs_review).toBe(true);
  });
});
