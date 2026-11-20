/**
 * Writes the JSON Schema of the content pack format to docs/api/pack.schema.json.
 * Run after changing src/lib/content/schema.ts: `npm run content:schema`.
 */
import { writeFileSync } from 'fs';
import path from 'path';
import { packJsonSchema } from '../src/lib/content/schema';

const target = path.join(process.cwd(), 'docs/api/pack.schema.json');
writeFileSync(target, `${JSON.stringify(packJsonSchema(), null, 2)}\n`);
console.log(`Wrote ${target}`);
