import { describe, it, expect } from 'vitest';
import { getManPage, searchManPages, getAllManPages } from '../src/lib/man-engine';

describe('Embedded Man Engine', () => {
  it('should retrieve structured man page for ps', () => {
    const page = getManPage('ps');
    expect(page).not.toBeNull();
    expect(page?.command).toBe('ps');
    expect(page?.synopsis).toContain('ps');
    expect(page?.options.length).toBeGreaterThan(0);
    expect(page?.examples.length).toBeGreaterThan(0);
  });

  it('should search man pages by query keyword in command, title or description', () => {
    const results = searchManPages('socket');
    expect(results.some((r) => r.command === 'ss')).toBe(true);
  });

  it('should be case-insensitive and handle command lookup with leading/trailing spaces', () => {
    const page = getManPage('  TOP  ');
    expect(page?.command).toBe('top');
  });

  it('should return null for unknown command', () => {
    const page = getManPage('unknown-xyz-binary');
    expect(page).toBeNull();
  });

  it('should return all bundled man pages', () => {
    const pages = getAllManPages();
    expect(pages.length).toBeGreaterThanOrEqual(10);
  });
});
