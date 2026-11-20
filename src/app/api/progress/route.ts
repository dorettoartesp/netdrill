import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { calculateSM2 } from '@/lib/sm2';

/**
 * Records a completed drill and schedules its next review with SM-2.
 *
 * @param req - Request with `{ drillId, grade }`.
 * @returns NextResponse with updated repetition count and due date.
 */
export async function POST(req: NextRequest) {
  try {
    const { drillId, grade = 5 } = await req.json();

    if (!drillId || typeof drillId !== 'string') {
      return NextResponse.json({ error: 'drillId is required.' }, { status: 400 });
    }

    const db = getDbClient();
    const existing = await db.execute({
      sql: 'SELECT * FROM progress WHERE drill_id = ?;',
      args: [drillId],
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
      sql: `INSERT INTO progress (drill_id, repetitions, interval_days, ease_factor, due_date, total_drilled_count, last_reviewed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(drill_id) DO UPDATE SET
              repetitions = excluded.repetitions,
              interval_days = excluded.interval_days,
              ease_factor = excluded.ease_factor,
              due_date = excluded.due_date,
              total_drilled_count = excluded.total_drilled_count,
              last_reviewed_at = excluded.last_reviewed_at;`,
      args: [
        drillId,
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
  } catch (err) {
    console.error('[api/progress] failure', err);
    return NextResponse.json({ error: 'Progress could not be saved. Please try again.' }, { status: 500 });
  }
}
