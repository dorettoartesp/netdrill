import { describe, it, expect } from 'vitest';
import { normalizeLine, compareBlock, isExitCommand } from '../src/lib/validator';

describe('Drill Validator', () => {
  it('should normalize single line trimming extra outer spaces', () => {
    expect(normalizeLine('  diagnose sys top 2 10  ')).toBe('diagnose sys top 2 10');
  });

  it('should validate single-line command ignoring edge whitespaces', () => {
    const res = compareBlock(['  diagnose sys top 2 10  '], 'diagnose sys top 2 10');
    expect(res.isMatch).toBe(true);
    expect(res.mismatchLine).toBeUndefined();
  });

  it('should validate FortiOS multi-line hierarchical block with varied indentation', () => {
    const target = `config system interface\n    edit port2\n        set ip 10.0.0.1 255.255.255.0\n    next\nend`;
    const input = [
      'config system interface',
      'edit port2',
      'set ip 10.0.0.1 255.255.255.0',
      'next',
      'end',
    ];
    const res = compareBlock(input, target);
    expect(res.isMatch).toBe(true);
  });

  it('should detect mismatch line when input diverges from target', () => {
    const target = `config system interface\n    edit port2\n    next\nend`;
    const input = [
      'config system interface',
      'edit port3', // error!
    ];
    const res = compareBlock(input, target);
    expect(res.isMatch).toBe(false);
    expect(res.mismatchLine).toBe(1);
  });

  it('should detect exit commands :done and pronto', () => {
    expect(isExitCommand(':done')).toBe(true);
    expect(isExitCommand('  :DONE ')).toBe(true);
    expect(isExitCommand('pronto')).toBe(true);
    expect(isExitCommand(':exit')).toBe(true);
    expect(isExitCommand('config firewall')).toBe(false);
  });
});
