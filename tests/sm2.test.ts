import { describe, it, expect } from 'vitest';
import { calculateSM2 } from '../src/lib/sm2';

describe('SM-2 Algorithm', () => {
  it('should calculate first repetition with 1 day interval', () => {
    const result = calculateSM2({
      repetitions: 0,
      intervalDays: 0,
      easeFactor: 2.5,
      grade: 5,
    });
    expect(result.repetitions).toBe(1);
    expect(result.intervalDays).toBe(1);
    expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
  });

  it('should calculate second repetition with 6 days interval', () => {
    const result = calculateSM2({
      repetitions: 1,
      intervalDays: 1,
      easeFactor: 2.5,
      grade: 4,
    });
    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(6);
  });

  it('should scale interval by ease factor on third repetition', () => {
    const result = calculateSM2({
      repetitions: 2,
      intervalDays: 6,
      easeFactor: 2.5,
      grade: 4,
    });
    expect(result.repetitions).toBe(3);
    expect(result.intervalDays).toBe(Math.round(6 * 2.5));
  });

  it('should reset repetitions to 0 if grade is below 3 (failure)', () => {
    const result = calculateSM2({
      repetitions: 4,
      intervalDays: 14,
      easeFactor: 2.5,
      grade: 2,
    });
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it('should never let ease factor fall below 1.3 minimum floor', () => {
    const result = calculateSM2({
      repetitions: 0,
      intervalDays: 0,
      easeFactor: 1.3,
      grade: 0,
    });
    expect(result.easeFactor).toBe(1.3);
  });
});
