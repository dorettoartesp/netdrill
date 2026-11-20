import { Client } from '@libsql/client';

export interface QueueItem {
  id: string;
  module_id: string;
  type: 'command' | 'block' | 'cloze' | 'quiz';
  title: string;
  prompt: string;
  target: string;
  explanation?: string;
  image_url?: string;
  tags?: string;
  isDue: boolean;
}

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
