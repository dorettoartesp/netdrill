import { Client, InStatement } from '@libsql/client';
import { validatePack, ValidationIssue, CommandDoc, ProcedureDoc } from './schema';
import { drillRefsFor } from './drills';

/** Counts of what an import changed (or would change, for a dry run). */
export interface ImportSummary {
  documentsCreated: number;
  documentsUpdated: number;
  documentsRemoved: number;
  drillsCreated: number;
  drillsRemoved: number;
}

/** Outcome of {@link importPack}. */
export type ImportResult =
  | { ok: true; dryRun: boolean; summary: ImportSummary; warnings: ValidationIssue[] }
  | { ok: false; issues: ValidationIssue[] };

const GENERIC_FAILURE: ImportResult = {
  ok: false,
  issues: [{ path: '', message: 'The import could not be completed. Please try again.' }],
};

interface StoredDoc {
  kind: string;
  topicSlug: string;
}

/** Statements that delete a document and everything derived from it (no reliance on FK cascades). */
function deleteDocumentStatements(id: string): InStatement[] {
  return [
    { sql: 'DELETE FROM progress WHERE drill_id IN (SELECT id FROM drills WHERE document_id = ?);', args: [id] },
    { sql: 'DELETE FROM drills WHERE document_id = ?;', args: [id] },
    { sql: 'DELETE FROM document_links WHERE from_id = ?;', args: [id] },
    { sql: 'DELETE FROM documents WHERE id = ?;', args: [id] },
  ];
}

/**
 * Validates and imports a content pack in a single write transaction.
 * Re-importing is idempotent: documents and drills are upserted by id, progress of surviving
 * drills is kept, drills whose example disappeared are deleted with their progress, and
 * documents absent from the pack are never touched (only `remove` deletes).
 *
 * @param db - libSQL client with schema v2.
 * @param raw - Parsed JSON body of unknown shape.
 * @param opts - `dryRun` computes the summary and warnings without writing.
 * @returns The summary and warnings, or validation issues; database failures yield a generic message.
 */
export async function importPack(
  db: Client,
  raw: unknown,
  opts: { dryRun?: boolean } = {}
): Promise<ImportResult> {
  const validation = validatePack(raw);
  if (!validation.ok) return { ok: false, issues: validation.issues };
  const { pack } = validation;
  const warnings = [...validation.warnings];
  const topic = pack.topic.slug;

  try {
    const docIds = [...pack.commands.map((c) => c.id), ...pack.procedures.map((p) => p.id), ...pack.remove];
    const referenced = [
      ...pack.commands.flatMap((c) => c.related),
      ...pack.procedures.flatMap((p) => p.uses),
    ];

    const stored = new Map<string, StoredDoc>();
    const lookupIds = Array.from(new Set([...docIds, ...referenced]));
    if (lookupIds.length) {
      const rs = await db.execute({
        sql: `SELECT id, kind, topic_slug FROM documents WHERE id IN (${lookupIds.map(() => '?').join(', ')});`,
        args: lookupIds,
      });
      for (const row of rs.rows) stored.set(String(row.id), { kind: String(row.kind), topicSlug: String(row.topic_slug) });
    }

    const storedDrills = new Map<string, Set<string>>();
    const touched = [...pack.commands.map((c) => c.id), ...pack.procedures.map((p) => p.id), ...pack.remove].filter((id) => stored.has(id));
    if (touched.length) {
      const rs = await db.execute({
        sql: `SELECT id, document_id FROM drills WHERE document_id IN (${touched.map(() => '?').join(', ')});`,
        args: touched,
      });
      for (const row of rs.rows) {
        const docId = String(row.document_id);
        if (!storedDrills.has(docId)) storedDrills.set(docId, new Set());
        storedDrills.get(docId)!.add(String(row.id));
      }
    }

    // Cross-checks against stored state.
    const issues: ValidationIssue[] = [];
    const checkKind = (id: string, kind: 'command' | 'procedure', path: string) => {
      const prev = stored.get(id);
      if (prev && prev.kind !== kind) {
        issues.push({ path, message: `Id "${id}" is already used by a ${prev.kind}.` });
      }
    };
    pack.commands.forEach((c, i) => checkKind(c.id, 'command', `commands[${i}].id`));
    pack.procedures.forEach((p, i) => checkKind(p.id, 'procedure', `procedures[${i}].id`));
    pack.remove.forEach((id, i) => {
      if (!id.startsWith(`${topic}.`)) {
        issues.push({ path: `remove[${i}]`, message: `Only documents of topic "${topic}" can be removed by this pack.` });
      } else if (!stored.has(id)) {
        warnings.push({ path: `remove[${i}]`, message: `Document "${id}" does not exist; nothing to remove.` });
      }
    });
    if (issues.length) return { ok: false, issues };

    // Unresolved references are warnings: the target may arrive in a later pack.
    const knownCommands = new Set([
      ...pack.commands.map((c) => c.id),
      ...Array.from(stored.entries()).filter(([, d]) => d.kind === 'command').map(([id]) => id),
    ]);
    const warnRef = (id: string, path: string) => {
      if (!knownCommands.has(id)) {
        warnings.push({ path, message: `Command "${id}" is not uploaded yet; the link activates once it is.` });
      }
    };
    pack.commands.forEach((c, i) => c.related.forEach((id, j) => warnRef(id, `commands[${i}].related[${j}]`)));
    pack.procedures.forEach((p, i) => p.uses.forEach((id, j) => warnRef(id, `procedures[${i}].uses[${j}]`)));

    // Plan statements and summary.
    const now = new Date().toISOString();
    const summary: ImportSummary = { documentsCreated: 0, documentsUpdated: 0, documentsRemoved: 0, drillsCreated: 0, drillsRemoved: 0 };
    const statements: InStatement[] = [
      {
        sql: `INSERT INTO topics (slug, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET title = excluded.title, description = excluded.description, updated_at = excluded.updated_at;`,
        args: [topic, pack.topic.title, pack.topic.description ?? null, now, now],
      },
    ];

    const upsertDocument = (doc: CommandDoc | ProcedureDoc, kind: 'command' | 'procedure') => {
      const isNew = !stored.has(doc.id);
      if (isNew) summary.documentsCreated++;
      else summary.documentsUpdated++;
      const name = kind === 'command' ? (doc as CommandDoc).name : (doc as ProcedureDoc).title;
      statements.push({
        sql: `INSERT INTO documents (id, kind, topic_slug, name, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET name = excluded.name, body = excluded.body, updated_at = excluded.updated_at;`,
        args: [doc.id, kind, topic, name, JSON.stringify(doc), now, now],
      });

      statements.push({ sql: 'DELETE FROM document_links WHERE from_id = ?;', args: [doc.id] });
      const links = kind === 'command'
        ? (doc as CommandDoc).related.map((to) => ({ to, relation: 'related' }))
        : (doc as ProcedureDoc).uses.map((to) => ({ to, relation: 'uses' }));
      for (const link of links) {
        statements.push({
          sql: 'INSERT OR IGNORE INTO document_links (from_id, to_id, relation) VALUES (?, ?, ?);',
          args: [doc.id, link.to, link.relation],
        });
      }

      const refs = drillRefsFor(doc, kind);
      const previous = storedDrills.get(doc.id) ?? new Set<string>();
      const current = new Set(refs.map((r) => r.id));
      for (const oldId of Array.from(previous)) {
        if (!current.has(oldId)) {
          summary.drillsRemoved++;
          statements.push({ sql: 'DELETE FROM progress WHERE drill_id = ?;', args: [oldId] });
          statements.push({ sql: 'DELETE FROM drills WHERE id = ?;', args: [oldId] });
        }
      }
      for (const ref of refs) {
        if (!previous.has(ref.id)) summary.drillsCreated++;
        statements.push({
          sql: `INSERT INTO drills (id, document_id, kind, topic_slug, position, created_at) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET position = excluded.position;`,
          args: [ref.id, doc.id, ref.kind, topic, ref.position, now],
        });
        statements.push({
          sql: 'INSERT OR IGNORE INTO progress (drill_id, due_date) VALUES (?, ?);',
          args: [ref.id, now],
        });
      }
    };

    pack.commands.forEach((c) => upsertDocument(c, 'command'));
    pack.procedures.forEach((p) => upsertDocument(p, 'procedure'));

    for (const id of pack.remove) {
      if (!stored.has(id)) continue;
      summary.documentsRemoved++;
      summary.drillsRemoved += storedDrills.get(id)?.size ?? 0;
      statements.push(...deleteDocumentStatements(id));
    }

    if (!opts.dryRun) await db.batch(statements, 'write');
    return { ok: true, dryRun: Boolean(opts.dryRun), summary, warnings };
  } catch (err) {
    console.error('[importPack] database failure', err);
    return GENERIC_FAILURE;
  }
}
