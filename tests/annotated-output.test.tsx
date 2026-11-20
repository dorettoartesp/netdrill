import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnnotatedOutput } from '../src/components/AnnotatedOutput';
import { parseAnnotatedOutput } from '../src/lib/telemetry-glossary';

const parsed = parseAnnotatedOutput('USER PID %CPU STAT COMMAND\napp 3100 85.4 D java');
const render = (selectedKey: string | null = null) =>
  renderToStaticMarkup(
    <AnnotatedOutput command="ps aux" segments={parsed.segments} selectedKey={selectedKey} onSelect={() => {}} />
  );

describe('AnnotatedOutput', () => {
  it('offers an optional line-wrap toggle that starts off', () => {
    expect(render()).toMatch(/<button[^>]*aria-pressed="false"[^>]*>[\s\S]*?Wrap lines/);
  });

  it('preserves terminal columns with horizontal scroll while wrap is off', () => {
    expect(render()).toMatch(/data-output="raw"[^>]*class="[^"]*whitespace-pre(?!-)[^"]*overflow-x-auto/);
  });

  it('never lets the flex parent shrink the output box (it must grow with wrapped lines)', () => {
    expect(render()).toMatch(/<section[^>]*class="[^"]*shrink-0/);
  });

  it('highlights tokens without vertical padding or borders that inflate line height', () => {
    const tokens = render().match(/<button[^>]*data-metric[^>]*>/g) ?? [];
    expect(tokens.length).toBeGreaterThan(0);
    for (const t of tokens) {
      expect(t).not.toMatch(/\bpy-/);
      expect(t).not.toMatch(/\bborder\b/);
    }
  });

  it('marks the selected token as pressed', () => {
    expect(render('stat_d')).toMatch(/<button[^>]*data-metric="stat_d"[^>]*aria-pressed="true"|<button[^>]*aria-pressed="true"[^>]*data-metric="stat_d"/);
  });
});
