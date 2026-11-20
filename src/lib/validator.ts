/**
 * Normalizes a command or configuration line by trimming external whitespace.
 *
 * @param line - Raw input line to normalize.
 * @returns Trimmed string.
 */
export function normalizeLine(line: string): string {
  return line.trim();
}

/**
 * Result details from a multi-line or single-line command block comparison.
 */
export interface BlockComparisonResult {
  /** True if all submitted lines match the target block lines in order and quantity. */
  isMatch: boolean;
  /** 0-based index of the first line that diverged, if any. */
  mismatchLine?: number;
  /** Expected target line content at the point of mismatch. */
  expectedLine?: string;
  /** Actual user-submitted line content at the point of mismatch. */
  actualLine?: string;
}

/**
 * Compares an array of user-typed lines against a target reference command or configuration block.
 *
 * @param inputLines - Array of lines currently typed by the user.
 * @param targetBlock - Raw target reference string containing expected lines separated by newlines.
 * @returns A BlockComparisonResult detailing match status and any mismatch line information.
 *
 * @example
 * ```ts
 * const res = compareBlock(['config system interface', 'edit port1'], 'config system interface\\nedit port1');
 * expect(res.isMatch).toBe(true);
 * ```
 */
export function compareBlock(
  inputLines: string[],
  targetBlock: string
): BlockComparisonResult {
  const targetLines = targetBlock
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (let i = 0; i < inputLines.length; i++) {
    const inputNormalized = normalizeLine(inputLines[i]);
    const targetNormalized = targetLines[i];

    if (targetNormalized === undefined || inputNormalized !== targetNormalized) {
      return {
        isMatch: false,
        mismatchLine: i,
        expectedLine: targetNormalized,
        actualLine: inputNormalized,
      };
    }
  }

  const isCompleteMatch = inputLines.length === targetLines.length;

  return {
    isMatch: isCompleteMatch,
  };
}

/**
 * Checks whether user input matches an explicit session exit trigger command (e.g., ':done', 'pronto').
 *
 * @param input - The raw string entered by the user.
 * @returns True if the input is an exit trigger command, false otherwise.
 */
export function isExitCommand(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  const exitTriggers = [':done', 'pronto', ':exit', ':q', 'done'];
  return exitTriggers.includes(normalized);
}
