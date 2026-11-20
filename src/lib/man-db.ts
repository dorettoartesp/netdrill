import { Client } from '@libsql/client';
import { ManPage } from '@/data/man';

export interface CachedManPage extends ManPage {
  source?: 'bundled' | 'ai_nemotron';
  created_at?: string;
  updated_at?: string;
}

/**
 * Retrieves a cached manpage from the database by command name.
 */
export async function getCachedManPage(db: Client, command: string): Promise<CachedManPage | null> {
  const cleanCmd = command.trim().toLowerCase().split(/\s+/)[0];
  const result = await db.execute({
    sql: 'SELECT * FROM man_pages WHERE command = ? LIMIT 1;',
    args: [cleanCmd]
  });

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  let options: string[] = [];
  let examples: string[] = [];

  try {
    const parsed = typeof row.options === 'string' ? JSON.parse(row.options) : row.options;
    options = Array.isArray(parsed) ? parsed : [];
  } catch {
    options = [];
  }

  try {
    const parsed = typeof row.examples === 'string' ? JSON.parse(row.examples) : row.examples;
    examples = Array.isArray(parsed) ? parsed : [];
  } catch {
    examples = [];
  }

  return {
    command: row.command as string,
    title: row.title as string,
    sectionName: (row.section_name || row.sectionName) as string,
    synopsis: row.synopsis as string,
    description: row.description as string,
    options,
    examples,
    source: (row.source || 'ai_nemotron') as 'bundled' | 'ai_nemotron',
    created_at: row.created_at as string,
    updated_at: row.updated_at as string
  };
}

/**
 * Upserts a manual page into the man_pages cache table.
 */
export async function upsertCachedManPage(
  db: Client,
  page: ManPage & { source?: 'bundled' | 'ai_nemotron' },
  source: 'bundled' | 'ai_nemotron' = 'ai_nemotron'
): Promise<void> {
  const cleanCmd = page.command.trim().toLowerCase().split(/\s+/)[0];
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO man_pages (
        command, title, section_name, synopsis, description, options, examples, source, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(command) DO UPDATE SET
        title = excluded.title,
        section_name = excluded.section_name,
        synopsis = excluded.synopsis,
        description = excluded.description,
        options = excluded.options,
        examples = excluded.examples,
        source = excluded.source,
        updated_at = excluded.updated_at;
    `,
    args: [
      cleanCmd,
      page.title,
      page.sectionName,
      page.synopsis,
      page.description,
      JSON.stringify(page.options || []),
      JSON.stringify(page.examples || []),
      source,
      now,
      now
    ]
  });
}

/**
 * Lists all cached manual pages ordered by command name ascending.
 */
export async function listCachedManPages(db: Client): Promise<CachedManPage[]> {
  const result = await db.execute('SELECT * FROM man_pages ORDER BY command ASC;');
  return result.rows.map((row) => {
    let options: string[] = [];
    let examples: string[] = [];

    try {
      options = typeof row.options === 'string' ? JSON.parse(row.options as string) : (row.options as unknown as string[]);
    } catch {
      options = [];
    }

    try {
      examples = typeof row.examples === 'string' ? JSON.parse(row.examples as string) : (row.examples as unknown as string[]);
    } catch {
      examples = [];
    }

    return {
      command: row.command as string,
      title: row.title as string,
      sectionName: (row.section_name || row.sectionName) as string,
      synopsis: row.synopsis as string,
      description: row.description as string,
      options,
      examples,
      source: (row.source || 'ai_nemotron') as 'bundled' | 'ai_nemotron',
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    };
  });
}
