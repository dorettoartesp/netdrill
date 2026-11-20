import { describe, it, expect } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations, SCHEMA_VERSION } from '../src/lib/migrate';

async function tableNames(db: ReturnType<typeof getDbClient>): Promise<string[]> {
  const rs = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
  return rs.rows.map((r) => String(r.name));
}

describe('Schema v2 migration', () => {
  it('creates v2 tables', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);
    const names = await tableNames(db);
    for (const t of ['schema_meta', 'topics', 'documents', 'document_links', 'drills', 'progress']) {
      expect(names).toContain(t);
    }
    const meta = await db.execute("SELECT value FROM schema_meta WHERE key = 'version';");
    expect(SCHEMA_VERSION).toBe('2');
    expect(meta.rows[0].value).toBe('2');
  });

  it('drops legacy tables on first v2 migration', async () => {
    const db = getDbClient(':memory:');
    await db.execute('CREATE TABLE topics (id TEXT PRIMARY KEY, slug TEXT, title TEXT);');
    await db.execute("INSERT INTO topics VALUES ('t1', 'linux', 'Linux');");
    await db.execute('CREATE TABLE modules (id TEXT PRIMARY KEY);');
    await db.execute('CREATE TABLE items (id TEXT PRIMARY KEY);');
    await db.execute('CREATE TABLE user_progress (id TEXT PRIMARY KEY);');
    await db.execute('CREATE TABLE man_pages (command TEXT PRIMARY KEY);');

    await runMigrations(db);

    const names = await tableNames(db);
    for (const legacy of ['modules', 'items', 'user_progress', 'man_pages']) {
      expect(names).not.toContain(legacy);
    }
    const cols = await db.execute('PRAGMA table_info(topics);');
    expect(cols.rows.map((r) => r.name)).toEqual(['slug', 'title', 'description', 'created_at', 'updated_at']);
    const rows = await db.execute('SELECT COUNT(*) AS n FROM topics;');
    expect(Number(rows.rows[0].n)).toBe(0);
  });

  it('is idempotent on v2', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);
    await db.execute("INSERT INTO topics (slug, title, created_at, updated_at) VALUES ('linux', 'Linux', 'x', 'x');");
    await runMigrations(db);
    const rows = await db.execute('SELECT COUNT(*) AS n FROM topics;');
    expect(Number(rows.rows[0].n)).toBe(1);
  });
});
