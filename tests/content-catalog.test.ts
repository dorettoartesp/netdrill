import { describe, it, expect } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { importPack } from '../src/lib/content/importer';
import { listDocuments, getDocument } from '../src/lib/content/catalog';
import { linuxPack } from './fixtures/content';

async function seeded() {
  const db = getDbClient(':memory:');
  await runMigrations(db);
  await importPack(db, linuxPack());
  await importPack(db, {
    format: 'netdrill.pack/v1',
    topic: { slug: 'linux', title: 'Linux' },
    commands: [{ id: 'linux.grep', name: 'grep', summary: 'Search text', synopsis: 'grep [options] pattern', description: 'd', related: ['linux.ss'] }],
  });
  return db;
}

describe('listDocuments', () => {
  it('lists commands and procedures with summaries', async () => {
    const db = await seeded();
    const all = await listDocuments(db);
    expect(all.map((d) => d.id)).toEqual(['linux.grep', 'linux.ss', 'linux.oom']);
    expect(all.find((d) => d.id === 'linux.ss')).toEqual({ id: 'linux.ss', kind: 'command', topicSlug: 'linux', name: 'ss', summary: 'Socket inspection' });
    expect(all.find((d) => d.id === 'linux.oom')).toMatchObject({ kind: 'procedure', name: 'OOM triage', summary: 'The API is OOM-killed under load.' });
  });

  it('filters by kind and case-insensitive name query', async () => {
    const db = await seeded();
    expect((await listDocuments(db, { kind: 'procedure' })).map((d) => d.id)).toEqual(['linux.oom']);
    expect((await listDocuments(db, { query: 'GR' })).map((d) => d.id)).toEqual(['linux.grep']);
  });
});

describe('getDocument', () => {
  it('returns a command with backlinks', async () => {
    const db = await seeded();
    const doc = await getDocument(db, 'linux.ss');
    expect(doc?.summary.kind).toBe('command');
    expect(doc?.usedBy.map((d) => d.id)).toEqual(['linux.oom']);
    expect(doc?.relatedBy.map((d) => d.id)).toEqual(['linux.grep']);
  });

  it('returns a procedure with resolved uses', async () => {
    const db = await seeded();
    const doc = await getDocument(db, 'linux.oom');
    expect(doc?.uses.map((d) => d.id)).toEqual(['linux.grep', 'linux.ss']);
  });

  it('returns null for an unknown id', async () => {
    const db = await seeded();
    expect(await getDocument(db, 'linux.nope')).toBeNull();
  });
});
