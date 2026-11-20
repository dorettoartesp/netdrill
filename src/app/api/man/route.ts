import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';
import { listDocuments } from '@/lib/content/catalog';

export const dynamic = 'force-dynamic';

/**
 * Lists manual entries (uploaded commands and procedures).
 *
 * @param req - Optional `q` (name substring) and `kind` (`command` | `procedure`) query parameters.
 * @returns 200 with `DocumentSummary[]`, or 500 with a generic message.
 */
export async function GET(req: NextRequest) {
  try {
    const db = getDbClient();
    await runMigrations(db);
    const q = req.nextUrl.searchParams.get('q') ?? undefined;
    const kindParam = req.nextUrl.searchParams.get('kind');
    const kind = kindParam === 'command' || kindParam === 'procedure' ? kindParam : undefined;
    return NextResponse.json(await listDocuments(db, { query: q, kind }));
  } catch (err) {
    console.error('[api/man] failure', err);
    return NextResponse.json({ error: 'The manual could not be loaded. Please try again.' }, { status: 500 });
  }
}
