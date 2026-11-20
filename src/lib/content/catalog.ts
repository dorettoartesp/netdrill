import { Client } from '@libsql/client';
import { CommandDoc, ProcedureDoc } from './schema';

/** One row of the manual catalog. */
export interface DocumentSummary {
  id: string;
  kind: 'command' | 'procedure';
  topicSlug: string;
  /** Command name or procedure title. */
  name: string;
  /** Command summary, or procedure goal (falling back to its context). */
  summary: string;
}

/** A full manual entry with resolved cross-references. */
export interface DocumentEntry {
  summary: DocumentSummary;
  body: CommandDoc | ProcedureDoc;
  /** Commands a procedure uses (resolved ones only). */
  uses: DocumentSummary[];
  /** Procedures that use this command. */
  usedBy: DocumentSummary[];
  /** Commands this command lists as related (resolved ones only). */
  related: DocumentSummary[];
  /** Commands that list this command as related. */
  relatedBy: DocumentSummary[];
}

function toSummary(row: Record<string, unknown>): DocumentSummary {
  const kind = String(row.kind) as DocumentSummary['kind'];
  const body = JSON.parse(String(row.body)) as CommandDoc | ProcedureDoc;
  const summary = kind === 'command' ? (body as CommandDoc).summary : ((body as ProcedureDoc).goal ?? (body as ProcedureDoc).context);
  return { id: String(row.id), kind, topicSlug: String(row.topic_slug), name: String(row.name), summary };
}

/**
 * Lists manual entries: commands first, then procedures, each ordered by name.
 *
 * @param db - libSQL client with schema v2.
 * @param opts - Optional kind, topic and case-insensitive name substring filters.
 * @returns Matching document summaries.
 */
export async function listDocuments(
  db: Client,
  opts: { kind?: 'command' | 'procedure'; query?: string; topicSlug?: string } = {}
): Promise<DocumentSummary[]> {
  const where: string[] = [];
  const args: string[] = [];
  if (opts.kind) {
    where.push('kind = ?');
    args.push(opts.kind);
  }
  if (opts.topicSlug) {
    where.push('topic_slug = ?');
    args.push(opts.topicSlug);
  }
  if (opts.query && opts.query.trim()) {
    where.push("LOWER(name) LIKE ? ESCAPE '\\'");
    args.push(`%${opts.query.trim().toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  }
  const rs = await db.execute({
    sql: `SELECT id, kind, topic_slug, name, body FROM documents
          ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
          ORDER BY CASE kind WHEN 'command' THEN 0 ELSE 1 END, LOWER(name), id;`,
    args,
  });
  return rs.rows.map((r) => toSummary(r as Record<string, unknown>));
}

async function summariesWhere(db: Client, sql: string, args: string[]): Promise<DocumentSummary[]> {
  const rs = await db.execute({ sql, args });
  return rs.rows.map((r) => toSummary(r as Record<string, unknown>));
}

/**
 * Loads one manual entry with its cross-references.
 *
 * @param db - libSQL client with schema v2.
 * @param id - Document id (e.g. `linux.ss`).
 * @returns The entry, or null when no document has this id.
 */
export async function getDocument(db: Client, id: string): Promise<DocumentEntry | null> {
  const rs = await db.execute({ sql: 'SELECT id, kind, topic_slug, name, body FROM documents WHERE id = ?;', args: [id] });
  if (!rs.rows.length) return null;
  const row = rs.rows[0] as Record<string, unknown>;
  const cols = 'd.id, d.kind, d.topic_slug, d.name, d.body';
  const order = 'ORDER BY LOWER(d.name), d.id';
  const [uses, usedBy, related, relatedBy] = await Promise.all([
    summariesWhere(db, `SELECT ${cols} FROM document_links l JOIN documents d ON d.id = l.to_id WHERE l.from_id = ? AND l.relation = 'uses' ${order};`, [id]),
    summariesWhere(db, `SELECT ${cols} FROM document_links l JOIN documents d ON d.id = l.from_id WHERE l.to_id = ? AND l.relation = 'uses' ${order};`, [id]),
    summariesWhere(db, `SELECT ${cols} FROM document_links l JOIN documents d ON d.id = l.to_id WHERE l.from_id = ? AND l.relation = 'related' ${order};`, [id]),
    summariesWhere(db, `SELECT ${cols} FROM document_links l JOIN documents d ON d.id = l.from_id WHERE l.to_id = ? AND l.relation = 'related' ${order};`, [id]),
  ]);
  return { summary: toSummary(row), body: JSON.parse(String(row.body)), uses, usedBy, related, relatedBy };
}
