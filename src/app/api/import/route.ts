import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';
import { importPack } from '@/lib/content/importer';

export const dynamic = 'force-dynamic';

/** Maximum accepted request body, in bytes (spec §9). */
const MAX_BODY_BYTES = 2 * 1024 * 1024;

const failure = (message: string, status: number) =>
  NextResponse.json({ ok: false, issues: [{ path: '', message }] }, { status });

/**
 * Validates and imports a `netdrill.pack/v1` content pack.
 * `?dryRun=true` validates and reports what would change without writing.
 *
 * @param req - Request whose body is the pack JSON (max 2 MB).
 * @returns 200 with the import summary and warnings, 400 with validation issues,
 *          413 when the body is too large, 500 with a generic message on server failure.
 */
export async function POST(req: NextRequest) {
  const text = await req.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
    return failure('The file exceeds the 2 MB limit.', 413);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return failure('The file is not valid JSON.', 400);
  }

  try {
    const db = getDbClient();
    await runMigrations(db);
    const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true';
    const result = await importPack(db, raw, { dryRun });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (err) {
    console.error('[api/import] unexpected failure', err);
    return failure('The import could not be completed. Please try again.', 500);
  }
}
