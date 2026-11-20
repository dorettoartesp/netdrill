import { createClient, Client } from '@libsql/client';

/**
 * Creates and returns a configured libSQL database client instance.
 *
 * @param overrideUrl - Optional explicit database connection URL to override environment settings (e.g. ':memory:').
 * @returns A connected libSQL Client instance ready for query execution.
 *
 * @example
 * ```ts
 * const db = getDbClient(':memory:');
 * await db.execute('SELECT 1;');
 * ```
 */
export function getDbClient(overrideUrl?: string): Client {
  if (overrideUrl) {
    return createClient({
      url: overrideUrl,
    });
  }

  const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  return createClient({
    url,
    authToken,
  });
}
