/**
 * Imports the content packs in content/seed into the configured database.
 * Idempotent: re-running updates content and keeps progress. Usage: `npm run db:seed`.
 */
import path from 'path';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { seedContent } from '../src/lib/content/seed';

async function main(): Promise<void> {
  const db = getDbClient();
  await runMigrations(db);
  const summary = await seedContent(db, path.join(process.cwd(), 'content/seed'));
  console.log(
    `Seeded ${summary.files} packs: ${summary.documentsCreated} documents created, ${summary.documentsUpdated} updated; ` +
      `${summary.drillsCreated} drills created, ${summary.drillsRemoved} removed.`
  );
}

main().catch((error) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
