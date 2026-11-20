/**
 * Standalone database migration runner.
 * Applies all DDL schema statements to the configured libSQL/Turso database.
 */
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';

async function main(): Promise<void> {
  console.log('Executing database schema migrations...');
  const db = getDbClient();
  await runMigrations(db);
  console.log('Migrations completed successfully.');
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
