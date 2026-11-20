import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';

/**
 * Updates the favorite or needs-review flag of a drill in `progress`.
 *
 * @param req - Request with `{ drillId, isFavorite?, needsReview? }`.
 * @returns JSON response confirming update status.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drillId, isFavorite, needsReview } = body;

    if (!drillId || typeof drillId !== 'string') {
      return NextResponse.json({ error: 'drillId is required.' }, { status: 400 });
    }

    const db = getDbClient();
    await runMigrations(db);

    const updates: string[] = [];
    const args: any[] = [];

    if (typeof isFavorite === 'boolean') {
      updates.push('is_favorite = ?');
      args.push(isFavorite ? 1 : 0);
    }

    if (typeof needsReview === 'boolean') {
      updates.push('needs_review = ?');
      args.push(needsReview ? 1 : 0);
    }

    if (updates.length > 0) {
      args.push(drillId);
      await db.execute({
        sql: `UPDATE progress SET ${updates.join(', ')} WHERE drill_id = ?;`,
        args,
      });
    }

    return NextResponse.json({
      success: true,
      drillId,
      isFavorite,
      needsReview,
    });
  } catch (err) {
    console.error('[api/progress/flag] failure', err);
    return NextResponse.json({ error: 'The flag could not be saved. Please try again.' }, { status: 500 });
  }
}
