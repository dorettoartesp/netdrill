export function normalizeLine(line: string): string {
  return line.trim();
}

export interface BlockComparisonResult {
  isMatch: boolean;
  mismatchLine?: number;
  expectedLine?: string;
  actualLine?: string;
}

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

  // If all input lines so far matched and count equals target lines
  const isCompleteMatch = inputLines.length === targetLines.length;

  return {
    isMatch: isCompleteMatch,
  };
}

export function isExitCommand(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  const exitTriggers = [':done', 'pronto', ':exit', ':q', 'done'];
  return exitTriggers.includes(normalized);
}
