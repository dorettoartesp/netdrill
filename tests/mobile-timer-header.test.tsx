import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TimerHeader } from '../src/components/TimerHeader';

const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u');
const html = renderToStaticMarkup(
  <TimerHeader
    initialMinutes={15}
    topicTitle="Listar portas"
    onLogout={() => {}}
    onTogglePause={() => {}}
    currentIndex={6}
    totalItems={30}
  />
);

describe('TimerHeader (mobile)', () => {
  it('uses no emoji', () => {
    expect(html).not.toMatch(EMOJI);
  });

  it('shows queue progress on mobile as "N de total"', () => {
    expect(html).toMatch(/<span class="(?![^"]*\bhidden\b)[^"]*">7 de 30<\/span>/);
  });

  it('offers 44px icon buttons with accessible names for navigation and logout', () => {
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*aria-label="Mudar tópicos"|<a[^>]*aria-label="Mudar tópicos"[^>]*href="\/"/);
    expect(html).toMatch(/aria-label="Sair"[^>]*class="[^"]*min-w-\[44px\][^"]*min-h-\[44px\]/);
  });

  it('makes the timer itself the pause control on mobile', () => {
    expect(html).toMatch(/<button[^>]*aria-label="Pausar cronômetro"[^>]*>[\s\S]*?15:00/);
  });

  it('keeps the man shortcut off the mobile header', () => {
    const mobileHeader = html.slice(0, html.indexOf('</header>'));
    expect(mobileHeader).toMatch(/^<header class="lg:hidden/);
    expect(mobileHeader).not.toContain('href="/man"');
  });
});
