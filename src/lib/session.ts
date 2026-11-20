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
  /** Optional realistic stdout/stderr terminal execution sample. */
  output_sample?: string;
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
 * Summary information for a topic, including total items and reviews due.
 */
export interface TopicSummary {
  /** Unique topic identifier. */
  id: string;
  /** Unique topic slug (e.g., 'linux', 'redes', 'fortigate'). */
  slug: string;
  /** Human-readable title of the topic. */
  title: string;
  /** Summary description of the topic. */
  description?: string;
  /** Total count of study items under this topic. */
  itemCount: number;
  /** Count of study items currently overdue for spaced repetition review. */
  dueCount: number;
}

/**
 * Retrieves all registered topics with their associated item counts and review statuses.
 *
 * @param db - The libSQL Client instance to query.
 * @returns A Promise resolving to an array of TopicSummary objects.
 */
export async function getAvailableTopics(db: Client): Promise<TopicSummary[]> {
  const now = new Date().toISOString();
  const query = `
    SELECT
      t.id, t.slug, t.title, t.description,
      COUNT(i.id) as item_count,
      SUM(CASE WHEN p.due_date IS NOT NULL AND p.due_date <= ? THEN 1 ELSE 0 END) as due_count
    FROM topics t
    LEFT JOIN modules m ON m.topic_id = t.id
    LEFT JOIN items i ON i.module_id = m.id
    LEFT JOIN user_progress p ON p.item_id = i.id
    GROUP BY t.id, t.slug, t.title, t.description
    ORDER BY t.created_at ASC;
  `;

  const result = await db.execute({ sql: query, args: [now] });

  return result.rows.map((row: any) => ({
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    description: row.description ? String(row.description) : undefined,
    itemCount: Number(row.item_count || 0),
    dueCount: Number(row.due_count || 0),
  }));
}

/**
 * Builds an ordered study session queue prioritizing overdue items first, followed by unstudied items.
 *
 * @param db - The libSQL Client instance to query.
 * @param topicFilter - Optional topic slug or array of topic slugs to filter by.
 * @returns A Promise resolving to an array of QueueItem objects ordered by review priority.
 *
 * @example
 * ```ts
 * const queue = await buildSessionQueue(db, ['linux', 'fortigate']);
 * console.log(`Items in queue: ${queue.length}`);
 * ```
 */
export async function buildSessionQueue(
  db: Client,
  topicFilter?: string | string[]
): Promise<QueueItem[]> {
  const now = new Date().toISOString();

  let query = `
    SELECT 
      i.id, i.module_id, i.type, i.title, i.prompt, i.target, i.output_sample, i.explanation, i.image_url, i.tags,
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

  if (topicFilter) {
    const slugs = (Array.isArray(topicFilter) ? topicFilter : [topicFilter])
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);

    if (slugs.length > 0) {
      const placeholders = slugs.map(() => '?').join(', ');
      query += ` WHERE t.slug IN (${placeholders}) `;
      args.push(...slugs);
    }
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
    output_sample: row.output_sample ? String(row.output_sample) : undefined,
    explanation: row.explanation,
    image_url: row.image_url,
    tags: row.tags,
    isDue: row.priority_rank === 1,
  }));
}
