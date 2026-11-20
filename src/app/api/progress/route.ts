import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { calculateSM2 } from '@/lib/sm2';

/**
 * Handles progress updates and SM-2 interval calculations for completed drill items.
 *
 * @param req - Incoming NextRequest with `{ itemId, grade }`.
 * @returns NextResponse with updated repetition count and due date.
 */
export async function POST(req: NextRequest) {
  try {
    const { itemId, grade = 5 } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: 'itemId é obrigatório.' }, { status: 400 });
    }

    const db = getDbClient();
    const existing = await db.execute({
      sql: 'SELECT * FROM user_progress WHERE item_id = ?;',
      args: [itemId],
    });

    let currentReps = 0;
    let currentInterval = 0;
    let currentEase = 2.5;
    let totalDrills = 1;

    if (existing.rows.length > 0) {
      const row: any = existing.rows[0];
      currentReps = row.repetitions || 0;
      currentInterval = row.interval_days || 0;
      currentEase = row.ease_factor || 2.5;
      totalDrills = (row.total_drilled_count || 0) + 1;
    }

    const sm2 = calculateSM2({
      repetitions: currentReps,
      intervalDays: currentInterval,
      easeFactor: currentEase,
      grade,
    });

    const nextDueDate = new Date(Date.now() + sm2.intervalDays * 86400000).toISOString();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO user_progress (id, item_id, repetitions, interval_days, ease_factor, due_date, total_drilled_count, last_reviewed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(item_id) DO UPDATE SET
              repetitions = excluded.repetitions,
              interval_days = excluded.interval_days,
              ease_factor = excluded.ease_factor,
              due_date = excluded.due_date,
              total_drilled_count = excluded.total_drilled_count,
              last_reviewed_at = excluded.last_reviewed_at;`,
      args: [
        `prog_${itemId}`,
        itemId,
        sm2.repetitions,
        sm2.intervalDays,
        sm2.easeFactor,
        nextDueDate,
        totalDrills,
        now,
      ],
    });

    return NextResponse.json({
      success: true,
      repetitions: sm2.repetitions,
      intervalDays: sm2.intervalDays,
      due_date: nextDueDate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Falha ao gravar progresso.' },
      { status: 500 }
    );
  }
}
