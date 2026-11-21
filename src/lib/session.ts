import { Client } from '@libsql/client';
import { CommandDoc, ProcedureDoc, OutputNote, UseCase } from './content/schema';
import { deriveDrillContent } from './content/drills';
import type { MetricDefinition } from './telemetry-glossary';

/** One drill prepared for the study session. */
export interface QueueItem {
  /** Drill id: `<command id>#<example id>` or the procedure id. */
  id: string;
  /** Id of the command or procedure document the drill belongs to. */
  documentId: string;
  kind: 'example' | 'procedure';
  title: string;
  /** Scenario shown to the learner. */
  prompt: string;
  /** Exact command or command sequence to type. */
  target: string;
  /** Whether the target spans several lines (block mode). */
  isMultiLine: boolean;
  explanation?: string;
  /** Realistic terminal output for the drill, when provided. */
  output_sample?: string;
  /** Structured annotations of tokens in the output. */
  output_notes: OutputNote[];
  /** Production use cases of the command or procedure. */
  use_cases: UseCase[];
  is_favorite: boolean;
  needs_review: boolean;
  /** True when the drill was reviewed before and is due again. */
  isDue: boolean;
}

/** Summary of a topic for the lobby. */
export interface TopicSummary {
  /** Topic identifier (equal to the slug). */
  id: string;
  slug: string;
  title: string;
  description?: string;
  /** Number of drills in the topic. */
  itemCount: number;
  /** Drills whose due date has passed (includes never-reviewed drills). */
  dueCount: number;
}

/**
 * Lists topics with drill and due counts, in creation order.
 *
 * @param db - libSQL client with schema v2.
 * @returns Topic summaries.
 */
export async function getAvailableTopics(db: Client): Promise<TopicSummary[]> {
  const rs = await db.execute({
    sql: `SELECT t.slug, t.title, t.description,
                 COUNT(d.id) AS item_count,
                 SUM(CASE WHEN p.due_date <= ? THEN 1 ELSE 0 END) AS due_count
          FROM topics t
          LEFT JOIN drills d ON d.topic_slug = t.slug
          LEFT JOIN progress p ON p.drill_id = d.id
          GROUP BY t.slug, t.title, t.description
          ORDER BY t.created_at ASC, t.slug ASC;`,
    args: [new Date().toISOString()],
  });
  return rs.rows.map((row) => ({
    id: String(row.slug),
    slug: String(row.slug),
    title: String(row.title),
    description: row.description ? String(row.description) : undefined,
    itemCount: Number(row.item_count || 0),
    dueCount: Number(row.due_count || 0),
  }));
}

/**
 * Builds the session queue: reviewed drills that are due first (most overdue first), then
 * never-reviewed drills in random order (mixing topics and commands), then the rest by due date.
 *
 * @param db - libSQL client with schema v2.
 * @param topicFilter - Optional topic slug(s).
 * @param random - Random source for shuffling new drills (injectable for tests).
 * @returns Ordered queue items.
 */
export async function buildSessionQueue(
  db: Client,
  topicFilter?: string | string[],
  random: () => number = Math.random
): Promise<QueueItem[]> {
  const now = new Date().toISOString();
  const slugs = (Array.isArray(topicFilter) ? topicFilter : topicFilter ? [topicFilter] : [])
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const where = slugs.length ? `WHERE d.topic_slug IN (${slugs.map(() => '?').join(', ')})` : '';
  const rs = await db.execute({
    sql: `SELECT d.id, d.kind, d.position, d.document_id, doc.body,
                 p.is_favorite, p.needs_review,
                 CASE
                   WHEN p.due_date <= ? AND p.total_drilled_count > 0 THEN 1
                   WHEN COALESCE(p.total_drilled_count, 0) = 0 THEN 2
                   ELSE 3
                 END AS rank
          FROM drills d
          JOIN documents doc ON doc.id = d.document_id
          LEFT JOIN progress p ON p.drill_id = d.id
          ${where}
          ORDER BY rank ASC, p.due_date ASC, doc.created_at ASC, d.document_id ASC, d.position ASC;`,
    args: [now, ...slugs],
  });

  const bodies = new Map<string, CommandDoc | ProcedureDoc>();
  const ordered = orderQueue(rs.rows.map((row) => ({ row, rank: Number(row.rank) })), random);
  return ordered.map(({ row }) => {
    const documentId = String(row.document_id);
    if (!bodies.has(documentId)) bodies.set(documentId, JSON.parse(String(row.body)));
    const kind = String(row.kind) as QueueItem['kind'];
    const content = deriveDrillContent({ id: String(row.id), kind, position: Number(row.position) }, bodies.get(documentId)!);
    return {
      id: String(row.id),
      documentId,
      kind,
      title: content.title,
      prompt: content.prompt,
      target: content.target,
      isMultiLine: content.isMultiLine,
      explanation: content.explanation,
      output_sample: content.output,
      output_notes: content.outputNotes,
      use_cases: content.useCases,
      is_favorite: Boolean(row.is_favorite),
      needs_review: Boolean(row.needs_review),
      isDue: Number(row.rank) === 1,
    };
  });
}

/**
 * Maps structured output notes onto the telemetry glossary shape used by the annotated output.
 *
 * @param notes - Output notes from a drill.
 * @returns Glossary definitions (missing baselines rendered as a dash).
 */
export function toMetricNotes(notes: OutputNote[]): MetricDefinition[] {
  return notes.map((n) => ({
    token: n.token,
    label: n.token,
    description: n.meaning,
    normalBaseline: n.normal ?? '—',
    anomalyAlert: n.anomaly ?? '—',
    severity: n.severity,
  }));
}

/**
 * Orders queue rows: rank 1 (due) and rank 3 (scheduled later) keep their incoming order,
 * rank 2 (never reviewed) is shuffled with Fisher-Yates so sessions mix topics and commands.
 *
 * @param rows - Rows carrying a numeric `rank`, already sorted by the database.
 * @param random - Random source in [0, 1).
 * @returns A new array; the input is not modified.
 */
export function orderQueue<T extends { rank: number }>(rows: readonly T[], random: () => number): T[] {
  const fresh = rows.filter((r) => r.rank === 2);
  for (let i = fresh.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
  }
  return [...rows.filter((r) => r.rank === 1), ...fresh, ...rows.filter((r) => r.rank !== 1 && r.rank !== 2)];
}

/**
 * Finds where a saved session should resume, by drill id (queue order changes between loads).
 *
 * @param queue - Current queue.
 * @param saved - Parsed saved state (`{ drillId }`); anything else starts from the beginning.
 * @returns The index of the saved drill, or 0.
 */
export function findResumeIndex(queue: ReadonlyArray<{ id: string }>, saved: unknown): number {
  const drillId = (saved as { drillId?: unknown } | null)?.drillId;
  if (typeof drillId !== 'string') return 0;
  const index = queue.findIndex((q) => q.id === drillId);
  return index >= 0 ? index : 0;
}
