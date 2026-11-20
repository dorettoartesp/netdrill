import { Client } from '@libsql/client';

/**
 * Represents a study queue item retrieved for an active practice session.
 */
export interface QueueItem {
  /** Unique item identifier. */
  id: string;
  /** Identifier of the module this item belongs to. */
  module_id: string;
  /** Type of challenge: command, block, cloze, or quiz. */
  type: 'command' | 'block' | 'cloze' | 'quiz';
  /** Human-readable short title. */
  title: string;
  /** Practical scenario or question prompt. */
  prompt: string;
  /** Expected target command line or multi-line configuration block. */
  target: string;
  /** Detailed technical explanation of flags and arguments. */
  explanation?: string;
  /** Optional screenshot or diagram URL. */
  image_url?: string;
  /** Comma-separated search tags. */
  tags?: string;
  /** Indicates whether this item is currently due for spaced repetition review. */
  isDue: boolean;
}

/**
 * Builds an ordered study session queue prioritizing overdue items first, followed by unstudied items.
 *
 * @param db - The libSQL Client instance to query.
 * @param topicSlug - Optional topic slug filter (e.g., 'linux', 'fortigate').
 * @returns A Promise resolving to an array of QueueItem objects ordered by review priority.
 *
 * @example
 * ```ts
 * const queue = await buildSessionQueue(db, 'fortigate');
 * console.log(`Items in queue: ${queue.length}`);
 * ```
 */
export async function buildSessionQueue(
  db: Client,
  topicSlug?: string
): Promise<QueueItem[]> {
  const now = new Date().toISOString();

  let query = `
    SELECT 
      i.id, i.module_id, i.type, i.title, i.prompt, i.target, i.explanation, i.image_url, i.tags,
      p.due_date,
      CASE 
        WHEN p.due_date IS NOT NULL AND p.due_date <= ? THEN 1
        WHEN p.due_date IS NULL THEN 2
        ELSE 3
      END as priority_rank
    FROM items i
    JOIN modules m ON i.module_id = m.id
    JOIN topics t ON m.topic_id = t.id
    LEFT JOIN user_progress p ON i.id = p.item_id
  `;

  const args: any[] = [now];

  if (topicSlug) {
    query += ` WHERE t.slug = ? `;
    args.push(topicSlug);
  }

  query += ` ORDER BY priority_rank ASC, p.due_date ASC, i.created_at ASC;`;

  const result = await db.execute({ sql: query, args });

  return result.rows.map((row: any) => ({
    id: row.id,
    module_id: row.module_id,
    type: row.type,
    title: row.title,
    prompt: row.prompt,
    target: row.target,
    explanation: row.explanation,
    image_url: row.image_url,
    tags: row.tags,
    isDue: row.priority_rank === 1,
  }));
}
