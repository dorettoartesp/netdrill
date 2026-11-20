import { Client } from '@libsql/client';

/** Current schema version stored in `schema_meta` under the key `version`. */
export const SCHEMA_VERSION = '2';

/**
 * Tables from any earlier schema; all are dropped once when upgrading to v2.
 * Order matters for engines that enforce foreign keys (children first).
 */
const DROP_ON_UPGRADE = [
  'user_progress',
  'items',
  'modules',
  'man_pages',
  'progress',
  'drills',
  'document_links',
  'documents',
  'topics',
];

/**
 * DDL of schema v2 (command-centric content documents).
 * `REFERENCES` clauses document relationships only: the importer deletes dependents explicitly
 * because foreign-key enforcement is not guaranteed per request on Turso over HTTP.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS topics (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('command', 'procedure')),
  topic_slug TEXT NOT NULL REFERENCES topics(slug),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS document_links (
  from_id TEXT NOT NULL REFERENCES documents(id),
  to_id TEXT NOT NULL,
  relation TEXT NOT NULL CHECK (relation IN ('uses', 'related')),
  PRIMARY KEY (from_id, to_id, relation)
);
CREATE TABLE IF NOT EXISTS drills (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id),
  kind TEXT NOT NULL CHECK (kind IN ('example', 'procedure')),
  topic_slug TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS progress (
  drill_id TEXT PRIMARY KEY REFERENCES drills(id),
  repetitions INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 0,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  due_date TEXT NOT NULL,
  total_drilled_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  needs_review INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_documents_topic ON documents(topic_slug, kind);
CREATE INDEX IF NOT EXISTS idx_document_links_to ON document_links(to_id);
CREATE INDEX IF NOT EXISTS idx_drills_topic ON drills(topic_slug);
CREATE INDEX IF NOT EXISTS idx_drills_document ON drills(document_id);
CREATE INDEX IF NOT EXISTS idx_progress_due ON progress(due_date);
`;

/** Reads the stored schema version, or null when the metadata table does not exist yet. */
async function storedVersion(db: Client): Promise<string | null> {
  try {
    const rs = await db.execute("SELECT value FROM schema_meta WHERE key = 'version';");
    return rs.rows.length ? String(rs.rows[0].value) : null;
  } catch {
    return null;
  }
}

/**
 * Brings the database to schema v2. Idempotent on v2; on any older or unknown state it drops
 * every legacy table (content and progress are discarded by design) and recreates the schema.
 *
 * @param db - The libSQL client to migrate.
 * @returns Resolves once the schema is at {@link SCHEMA_VERSION}.
 * @throws {Error} If a DDL statement fails.
 */
export async function runMigrations(db: Client): Promise<void> {
  if ((await storedVersion(db)) === SCHEMA_VERSION) return;

  const ddl = SCHEMA_SQL.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  await db.batch(
    [
      ...DROP_ON_UPGRADE.map((t) => `DROP TABLE IF EXISTS ${t};`),
      ...ddl,
      { sql: "INSERT INTO schema_meta (key, value) VALUES ('version', ?);", args: [SCHEMA_VERSION] },
    ],
    'write'
  );
}
