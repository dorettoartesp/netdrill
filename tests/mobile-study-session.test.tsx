import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudySession } from '../src/components/StudySession';
import type { QueueItem } from '../src/lib/session';

const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u');

const item = {
  id: 'i1',
  module_id: 'm1',
  type: 'command',
  title: 'Listar portas e processos em escuta',
  prompt: 'Como listar todos os sockets TCP e UDP abertos em modo de escuta com PID e nome do processo?',
  target: 'ss -tulpn',
  output_sample: 'Netid State  Recv-Q Send-Q\ntcp   LISTEN 0      128',
  isDue: true,
} as unknown as QueueItem;

const html = renderToStaticMarkup(<StudySession initialQueue={[item]} initialMinutes={15} />);

describe('StudySession (mobile layout)', () => {
  it('renders the three study modes as short labels without emoji', () => {
    expect(html).not.toMatch(EMOJI);
    for (const label of ['Treino', 'Casos de uso', 'Saída anotada']) {
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
    expect(html).toMatch(/<button[^>]*class="hidden lg:flex[^"]*"[^>]*title="Pressione M/);
  });

  it('sizes favorite and review toggles as 44px icon buttons with accessible names', () => {
    expect(html).toMatch(/<button[^>]*aria-label="Favoritar exercício"[^>]*class="[^"]*min-w-\[44px\][^"]*min-h-\[44px\]/);
    expect(html).toMatch(/<button[^>]*aria-label="Marcar para revisão"[^>]*class="[^"]*min-w-\[44px\][^"]*min-h-\[44px\]/);
  });
});
