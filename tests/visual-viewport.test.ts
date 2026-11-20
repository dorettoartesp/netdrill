import { describe, it, expect } from 'vitest';
import { keyboardInset } from '../src/lib/visual-viewport';

describe('keyboardInset', () => {
  it('is zero without a visual viewport', () => {
    expect(keyboardInset(844, null)).toBe(0);
  });
  it('is the height hidden below the visual viewport', () => {
    expect(keyboardInset(844, { height: 470, offsetTop: 0 })).toBe(374);
    expect(keyboardInset(844, { height: 470, offsetTop: 40 })).toBe(334);
  });
  it('is never negative', () => {
    expect(keyboardInset(844, { height: 900, offsetTop: 0 })).toBe(0);
  });
});
