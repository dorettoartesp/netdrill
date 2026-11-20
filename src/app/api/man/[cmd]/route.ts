import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';
import { getDocument } from '@/lib/content/catalog';

export const dynamic = 'force-dynamic';

/**
 * Returns one manual entry by document id (e.g. `linux.ss`) with its cross-references.
 *
 * @param _req - Unused request.
 * @param context - Route params; `cmd` is the document id.
 * @returns 200 with the entry, 404 when unknown, 500 with a generic message.
 */
export async function GET(_req: NextRequest, { params }: { params: { cmd: string } }) {
  try {
    const id = decodeURIComponent(params?.cmd ?? '').trim().toLowerCase();
    const db = getDbClient();
    await runMigrations(db);
    const entry = id ? await getDocument(db, id) : null;
    if (!entry) return NextResponse.json({ error: 'No manual entry found for this command.' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (err) {
    console.error('[api/man/[cmd]] failure', err);
    return NextResponse.json({ error: 'The manual could not be loaded. Please try again.' }, { status: 500 });
  }
}
