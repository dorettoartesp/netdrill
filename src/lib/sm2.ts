export interface SM2Params {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  grade: number; // 0 to 5
}

export interface SM2Result {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
}

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
