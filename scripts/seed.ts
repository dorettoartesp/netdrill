/**
 * Standalone database seed runner.
 * Populates the database with initial study exercises from seed-data.json.
 */
import * as fs from 'fs';
import * as path from 'path';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { importBulkData, BulkImportPayload } from '../src/lib/importer';

async function main(): Promise<void> {
  console.log('Connecting to database...');
  const db = getDbClient();

  console.log('Applying database schema migrations...');
  await runMigrations(db);

  console.log('Resetting existing database records for clean seeding...');
  await db.execute('DELETE FROM user_progress;');
  await db.execute('DELETE FROM items;');
  await db.execute('DELETE FROM modules;');
  await db.execute('DELETE FROM topics;');

  const seedFilePath = path.join(process.cwd(), 'src/data/seed-data.json');
  console.log(`Loading seed exercises from ${seedFilePath}...`);
  const rawData = fs.readFileSync(seedFilePath, 'utf-8');
  const payloads: BulkImportPayload[] = JSON.parse(rawData);

  let totalImported = 0;
  for (const payload of payloads) {
    console.log(
      `Importing topic "${payload.topic}" - module "${payload.module}" (${payload.items.length} items)...`
    );
    const result = await importBulkData(db, payload);
    if (!result.success) {
      throw new Error(`Failed to import module ${payload.module}: ${result.error}`);
    }
    totalImported += result.importedCount || 0;
  }

  console.log(`Seeding completed successfully! Total items imported: ${totalImported}`);
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
