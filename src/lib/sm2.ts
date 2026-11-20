/**
 * Input parameters required to calculate the next spaced repetition interval using the SM-2 algorithm.
 */
export interface SM2Params {
  /** The count of consecutive successful review repetitions completed so far. */
  repetitions: number;
  /** Current interval in days before the item became due. */
  intervalDays: number;
  /** Ease factor measure of item difficulty (minimum value is 1.3). */
  easeFactor: number;
  /** User recall performance grade ranging from 0 (complete blackout) to 5 (perfect recall). */
  grade: number;
}

/**
 * Result of the SM-2 calculation containing updated repetitions, next interval, and updated ease factor.
 */
export interface SM2Result {
  /** Updated count of successful consecutive repetitions. */
  repetitions: number;
  /** Number of days until the item is next due for review. */
  intervalDays: number;
  /** Updated ease factor rounded to two decimal places. */
  easeFactor: number;
}

/**
 * Calculates next review interval and updated ease factor using the classical SuperMemo-2 (SM-2) algorithm.
 *
 * @param params - Current SM-2 review parameters (repetitions, intervalDays, easeFactor, grade).
 * @returns An SM2Result containing the updated repetitions count, interval in days, and ease factor.
 *
 * @example
 * ```ts
 * const result = calculateSM2({ repetitions: 0, intervalDays: 0, easeFactor: 2.5, grade: 5 });
 * // result => { repetitions: 1, intervalDays: 1, easeFactor: 2.6 }
 * ```
 */
export function calculateSM2({
  repetitions,
  intervalDays,
  easeFactor,
  grade,
}: SM2Params): SM2Result {
  if (grade < 3) {
    return {
      repetitions: 0,
      intervalDays: 1,
      easeFactor: Math.max(1.3, easeFactor),
    };
  }

  let nextInterval: number;
  if (repetitions === 0) {
    nextInterval = 1;
  } else if (repetitions === 1) {
    nextInterval = 6;
  } else {
    nextInterval = Math.round(intervalDays * easeFactor);
  }

  const nextEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
  );

  return {
    repetitions: repetitions + 1,
    intervalDays: nextInterval,
    easeFactor: Number(nextEaseFactor.toFixed(2)),
  };
}
