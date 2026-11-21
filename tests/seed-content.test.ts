import { describe, it, expect } from 'vitest';
import path from 'path';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { validatePack } from '../src/lib/content/schema';
import { loadSeedPacks, seedContent } from '../src/lib/content/seed';

const SEED_DIR = path.resolve(__dirname, '../content/seed');
const packs = loadSeedPacks(SEED_DIR);

describe('seed content packs', () => {
  it('ships the five topics', () => {
    expect(packs.map((p) => p.file).sort()).toEqual(['docker.json', 'fortigate.json', 'linux.json', 'networking.json', 'postgresql.json']);
  });

  for (const { file, data } of packs) {
    it(`${file} is valid and produces no warnings`, () => {
      const r = validatePack(data);
      if (!r.ok) throw new Error(`${file}: ${JSON.stringify(r.issues.slice(0, 5))}`);
      expect(r.warnings).toEqual([]);
    });
  }

  it('uses each topic slug once', () => {
    const slugs = packs.map((p) => (p.data as any).topic.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('seedContent', () => {
  it('imports every pack and yields at least 200 drills', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);
    const summary = await seedContent(db, SEED_DIR);
    expect(summary.files).toBe(5);
    const drills = await db.execute('SELECT COUNT(*) AS n FROM drills;');
    expect(Number(drills.rows[0].n)).toBeGreaterThanOrEqual(200);
    expect(summary.drillsCreated).toBe(Number(drills.rows[0].n));
  });

  it('is idempotent and keeps progress', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);
    await seedContent(db, SEED_DIR);
    await db.execute("UPDATE progress SET repetitions = 4 WHERE drill_id = (SELECT id FROM drills ORDER BY id LIMIT 1);");
    const second = await seedContent(db, SEED_DIR);
    expect(second.drillsCreated).toBe(0);
    const rep = await db.execute('SELECT MAX(repetitions) AS r FROM progress;');
    expect(Number(rep.rows[0].r)).toBe(4);
  });

  it('stops with the file name when a pack is invalid', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);
    await expect(seedContent(db, path.resolve(__dirname, 'fixtures/invalid-seed'))).rejects.toThrow(/broken\.json/);
  });
});
