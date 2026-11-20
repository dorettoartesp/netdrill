import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudySession } from '../src/components/StudySession';
import type { QueueItem } from '../src/lib/session';

const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u');

const item: QueueItem = {
  id: 'linux.ss#listening',
  documentId: 'linux.ss',
  kind: 'example',
  title: 'Listar portas e processos em escuta',
  prompt: 'Como listar todos os sockets TCP e UDP abertos em modo de escuta com PID e nome do processo?',
  target: 'ss -tulpn',
  isMultiLine: false,
  output_sample: 'Netid State  Recv-Q Send-Q\ntcp   LISTEN 0      128',
  output_notes: [],
  use_cases: [],
  is_favorite: false,
  needs_review: false,
  isDue: true,
};

const html = renderToStaticMarkup(<StudySession initialQueue={[item]} initialMinutes={15} />);

describe('StudySession (mobile layout)', () => {
  it('renders the three study modes as short labels without emoji', () => {
    expect(html).not.toMatch(EMOJI);
    for (const label of ['Drill', 'Use cases', 'Annotated output']) {
      expect(html).toContain(`>${label}<`);
    }
  });

  it('shows keyboard shortcut hints only on desktop', () => {
    // Only visible text nodes matter; title attributes are desktop hover tooltips
    const hits = Array.from(html.matchAll(/>[^<]*Ctrl\+/g));
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      const before = html.slice(0, hit.index);
      const nearestClass = before.slice(before.lastIndexOf('class="'));
      expect(nearestClass).toMatch(/^class="[^"]*hidden lg:/);
    }
  });

  it('keeps the tab-row man launcher off mobile (the dock already offers it)', () => {
    expect(html).toMatch(/<button[^>]*class="hidden lg:flex[^"]*"[^>]*title="Press M/);
  });

  it('sizes favorite and review toggles as 44px icon buttons with accessible names', () => {
    expect(html).toMatch(/<button[^>]*aria-label="Favorite drill"[^>]*class="[^"]*min-w-\[44px\][^"]*min-h-\[44px\]/);
    expect(html).toMatch(/<button[^>]*aria-label="Flag for review"[^>]*class="[^"]*min-w-\[44px\][^"]*min-h-\[44px\]/);
  });
});
