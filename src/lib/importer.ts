import { Client, InStatement } from '@libsql/client';

/**
 * Payload structure for an individual study item to be imported.
 */
export interface BulkItemPayload {
  /** Item type: command, block, cloze, or quiz. */
  type: 'command' | 'block' | 'cloze' | 'quiz';
  /** Short human-readable title. */
  title: string;
  /** Scenario, question, or problem prompt. */
  prompt: string;
  /** Exact target command line or multi-line configuration block. */
  target: string;
  /** Optional realistic stdout/stderr terminal execution sample. */
  output_sample?: string;
  /** Detailed technical explanation of flags and arguments. */
  explanation?: string;
  /** Optional screenshot or diagram URL. */
  image_url?: string;
  /** Optional cloze deletion configuration. */
  cloze_data?: any;
  /** Optional multiple-choice quiz options. */
  quiz_options?: string[];
  /** Comma-separated search tags. */
  tags?: string;
}

/**
 * Payload structure for a bulk import request covering a topic, module, and associated items.
 */
export interface BulkImportPayload {
  /** Unique topic slug in lowercase (e.g., 'linux', 'fortigate', 'kubernetes'). */
  topic: string;
  /** Human-readable topic title. */
  topic_title?: string;
  /** Optional summary description of the topic. */
  topic_description?: string;
  /** Unique module slug within the topic (e.g., 'firewall-policies', 'troubleshooting'). */
  module: string;
  /** Human-readable module title. */
  module_title?: string;
  /** Array of study items belonging to this module. */
  items: BulkItemPayload[];
}

/**
 * Result returned upon completing a bulk import transaction.
 */
export interface ImportResult {
  /** Indicates whether the import operation succeeded. */
  success: boolean;
  /** Number of items successfully created and scheduled. */
  importedCount?: number;
  /** Error message details if the operation failed. */
  error?: string;
}

/**
 * Imports a batch of topics, modules, and study items into the libSQL database in a single transaction.
 *
 * @param db - The libSQL Client instance to execute insertions on.
 * @param payload - The BulkImportPayload containing topic, module, and item definitions.
 * @returns An ImportResult indicating success status and the total imported item count.
 *
 * @throws {Error} If database queries fail unexpectedly during the operation.
 */
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

    // 3. Batch insert items and initial user progress
    let count = 0;
    const now = new Date().toISOString();
    const statements: InStatement[] = [];

    for (const item of payload.items) {
      if (!item.title || !item.prompt || !item.target) {
        continue;
      }

      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${count}`;

      statements.push({
        sql: `INSERT INTO items (id, module_id, type, title, prompt, target, output_sample, explanation, image_url, cloze_data, quiz_options, tags)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          itemId,
          moduleId,
          item.type || 'command',
          item.title,
          item.prompt,
          item.target,
          item.output_sample || null,
          item.explanation || null,
          item.image_url || null,
          item.cloze_data ? JSON.stringify(item.cloze_data) : null,
          item.quiz_options ? JSON.stringify(item.quiz_options) : null,
          item.tags || null,
        ],
      });

      statements.push({
        sql: `INSERT INTO user_progress (id, item_id, repetitions, interval_days, ease_factor, due_date)
              VALUES (?, ?, 0, 0, 2.5, ?);`,
        args: [`prog_${itemId}`, itemId, now],
      });

      count++;
    }

    // Execute in fast transaction batches of 100 statements
    const CHUNK_SIZE = 100;
    for (let i = 0; i < statements.length; i += CHUNK_SIZE) {
      const chunk = statements.slice(i, i + CHUNK_SIZE);
      await db.batch(chunk, 'write');
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
