import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { Client } from '@libsql/client';
import { importPack, ImportSummary } from './importer';

/** A seed file read from disk. */
export interface SeedPack {
  file: string;
  data: unknown;
}

/** Totals of a seed run. */
export interface SeedSummary extends ImportSummary {
  files: number;
}

/**
 * Reads every `*.json` content pack in a directory, sorted by file name.
 *
 * @param dir - Directory holding the packs (e.g. `content/seed`).
 * @returns Parsed packs with their file names.
 * @throws {Error} When a file is not valid JSON (message names the file).
 */
export function loadSeedPacks(dir: string): SeedPack[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => {
      try {
        return { file, data: JSON.parse(readFileSync(path.join(dir, file), 'utf8')) };
      } catch {
        throw new Error(`${file}: not valid JSON`);
      }
    });
}

/**
 * Imports every seed pack with the same idempotent importer used by `/import`.
 * Nothing is deleted; re-running updates content and keeps progress.
 *
 * @param db - libSQL client with schema v2.
 * @param dir - Directory holding the packs.
 * @returns Summed import counts.
 * @throws {Error} On the first pack that fails, naming the file and its issues.
 */
export async function seedContent(db: Client, dir: string): Promise<SeedSummary> {
  const total: SeedSummary = { files: 0, documentsCreated: 0, documentsUpdated: 0, documentsRemoved: 0, drillsCreated: 0, drillsRemoved: 0 };
  for (const { file, data } of loadSeedPacks(dir)) {
    const result = await importPack(db, data);
    if (!result.ok) {
      const detail = result.issues.slice(0, 5).map((i) => `${i.path || '(root)'}: ${i.message}`).join('; ');
      throw new Error(`${file}: ${detail}`);
    }
    total.files++;
    for (const key of Object.keys(result.summary) as (keyof ImportSummary)[]) total[key] += result.summary[key];
  }
  return total;
}
