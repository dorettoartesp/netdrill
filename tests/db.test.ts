import { describe, it, expect } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';

describe('Database Layer', () => {
  it('should execute schema migrations and create required tables', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
    const tableNames = tables.rows.map(r => r.name);
    expect(tableNames).toContain('topics');
    expect(tableNames).toContain('modules');
    expect(tableNames).toContain('items');
    expect(tableNames).toContain('user_progress');
  });
});
