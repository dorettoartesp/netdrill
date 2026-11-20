import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { viewport } from '../src/app/layout';

const css = readFileSync(path.resolve(__dirname, '../src/app/globals.css'), 'utf8');

describe('iOS focus zoom prevention', () => {
  it('only shrinks form fields below 16px for fine pointers, never by viewport width', () => {
    expect(css).not.toMatch(/@media\s*\(min-width:\s*768px\)\s*{\s*input/);
    expect(css).toMatch(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*{\s*input,\s*textarea,\s*select\s*{\s*font-size:\s*14px/);
  });

  it('keeps pinch-zoom available (WCAG 1.4.4) instead of disabling user scaling', () => {
    expect(viewport.userScalable).not.toBe(false);
    expect(viewport.maximumScale).toBeUndefined();
  });
});

describe('scrollbar-none utility', () => {
  it('hides the scrollbar of horizontally scrolling toolbars on every engine', () => {
    expect(css).toMatch(/\.scrollbar-none\s*{[^}]*scrollbar-width:\s*none/);
    expect(css).toMatch(/\.scrollbar-none::-webkit-scrollbar\s*{[^}]*display:\s*none/);
  });
});
