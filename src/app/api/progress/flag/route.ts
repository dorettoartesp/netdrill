import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';

/**
 * Updates favorite status or review flag for a given study item in user_progress.
 *
 * @param req - Incoming request containing itemId and boolean flags for isFavorite or needsReview.
 * @returns JSON response confirming update status.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, isFavorite, needsReview } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'itemId é obrigatório' }, { status: 400 });
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
      args.push(itemId);
      await db.execute({
        sql: `UPDATE user_progress SET ${updates.join(', ')} WHERE item_id = ?;`,
        args,
      });
    }

    return NextResponse.json({
      success: true,
      itemId,
      isFavorite,
      needsReview,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Falha ao atualizar marcações do item' },
      { status: 500 }
    );
  }
}
