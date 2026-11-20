import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TopicSelector, formatSelectionSummary } from '../src/components/TopicSelector';
import type { TopicSummary } from '../src/lib/session';

const topics = [
  { id: '1', slug: 'linux', title: 'Administração Linux', description: 'Troubleshooting no Linux', itemCount: 10, dueCount: 3 },
  { id: '2', slug: 'redes', title: 'Redes de Computadores', description: 'Rotas e conectividade', itemCount: 10, dueCount: 0 },
] as TopicSummary[];

const html = renderToStaticMarkup(<TopicSelector topics={topics} />);

describe('formatSelectionSummary', () => {
  it('summarizes topics, exercises and duration', () => {
    expect(formatSelectionSummary(2, 20, 15)).toBe('2 tópicos · 20 exercícios · 15 min');
  });
  it('uses singular forms and the free-time label', () => {
    expect(formatSelectionSummary(1, 1, 0)).toBe('1 tópico · 1 exercício · sem limite');
  });
  it('asks for a selection when nothing is chosen', () => {
    expect(formatSelectionSummary(0, 0, 15)).toBe('Selecione ao menos um tópico');
  });
});

describe('TopicSelector (mobile)', () => {
  it('renders each topic as a toggle button exposing its pressed state', () => {
    expect(html.match(/<button[^>]*aria-pressed="true"[^>]*>[\s\S]*?Administração Linux/)).not.toBeNull();
    expect(html).not.toMatch(/<div[^>]*cursor-pointer[^>]*>[\s\S]{0,400}Administração Linux/);
  });

  it('exposes duration choices as a radio group with 44px targets', () => {
    expect(html).toMatch(/role="radiogroup"/);
    const radios = html.match(/<button[^>]*role="radio"[^>]*>/g) ?? [];
    expect(radios.length).toBe(4);
    for (const r of radios) expect(r).toMatch(/min-h-\[44px\]/);
  });

  it('keeps a sticky start action with the selection summary on mobile', () => {
    expect(html).toMatch(/class="[^"]*sticky bottom-0[^"]*"[\s\S]*2 tópicos · 20 exercícios · 15 min[\s\S]*Iniciar treino/);
  });

  it('hides keyboard shortcut hints on mobile', () => {
    for (const kbd of html.match(/<kbd[^>]*>/g) ?? []) expect(kbd).toMatch(/hidden lg:inline/);
    expect(html).toMatch(/<footer[^>]*class="hidden lg:flex/);
  });
});

import { isShortcutBlocked } from '../src/components/TopicSelector';

describe('isShortcutBlocked', () => {
  it('lets Enter activate a focused button instead of starting the session', () => {
    expect(isShortcutBlocked('Enter', { tagName: 'BUTTON' } as unknown as EventTarget)).toBe(true);
  });
  it('blocks every shortcut while typing in a field', () => {
    expect(isShortcutBlocked('a', { tagName: 'INPUT' } as unknown as EventTarget)).toBe(true);
    expect(isShortcutBlocked('1', { tagName: 'TEXTAREA' } as unknown as EventTarget)).toBe(true);
  });
  it('allows shortcuts from the page body and non-Enter keys on buttons', () => {
    expect(isShortcutBlocked('Enter', { tagName: 'BODY' } as unknown as EventTarget)).toBe(false);
    expect(isShortcutBlocked('a', { tagName: 'BUTTON' } as unknown as EventTarget)).toBe(false);
  });
});
