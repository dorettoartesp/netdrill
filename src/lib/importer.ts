import { Client } from '@libsql/client';

export interface BulkItemPayload {
  type: 'command' | 'block' | 'cloze' | 'quiz';
  title: string;
  prompt: string;
  target: string;
  explanation?: string;
  image_url?: string;
  cloze_data?: any;
  quiz_options?: string[];
  tags?: string;
}

export interface BulkImportPayload {
  topic: string;
  topic_title?: string;
  topic_description?: string;
  module: string;
  module_title?: string;
  items: BulkItemPayload[];
}

export interface ImportResult {
  success: boolean;
  importedCount?: number;
  error?: string;
}

export async function importBulkData(
  db: Client,
  payload: BulkImportPayload
): Promise<ImportResult> {
  if (
    !payload ||
    !payload.topic ||
    !payload.module ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0
  ) {
    return {
      success: false,
      error: 'Payload inválido: topic, module e items com pelo menos 1 item são obrigatórios.',
    };
  }

  try {
    const topicSlug = payload.topic.trim().toLowerCase();
    const topicTitle = payload.topic_title || payload.topic;
    const moduleSlug = payload.module.trim().toLowerCase();
    const moduleTitle = payload.module_title || payload.module;

    // 1. Upsert Topic
    const topicId = `topic_${topicSlug}`;
    await db.execute({
      sql: `INSERT INTO topics (id, slug, title, description) 
            VALUES (?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET title = excluded.title;`,
      args: [topicId, topicSlug, topicTitle, payload.topic_description || null],
    });

    // 2. Upsert Module
    const moduleId = `mod_${topicSlug}_${moduleSlug}`;
    await db.execute({
      sql: `INSERT INTO modules (id, topic_id, slug, title)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(topic_id, slug) DO UPDATE SET title = excluded.title;`,
      args: [moduleId, topicId, moduleSlug, moduleTitle],
    });

    // 3. Insert items and initial user progress
    let count = 0;
    const now = new Date().toISOString();

    for (const item of payload.items) {
      if (!item.title || !item.prompt || !item.target) {
        continue;
      }

      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      await db.execute({
        sql: `INSERT INTO items (id, module_id, type, title, prompt, target, explanation, image_url, cloze_data, quiz_options, tags)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          itemId,
          moduleId,
          item.type || 'command',
          item.title,
          item.prompt,
          item.target,
          item.explanation || null,
          item.image_url || null,
          item.cloze_data ? JSON.stringify(item.cloze_data) : null,
          item.quiz_options ? JSON.stringify(item.quiz_options) : null,
          item.tags || null,
        ],
      });

      await db.execute({
        sql: `INSERT INTO user_progress (id, item_id, repetitions, interval_days, ease_factor, due_date)
              VALUES (?, ?, 0, 0, 2.5, ?);`,
        args: [`prog_${itemId}`, itemId, now],
      });

      count++;
    }

    return {
      success: true,
      importedCount: count,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Erro durante a importação no banco de dados',
    };
  }
}
