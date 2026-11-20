import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MobileKeyboardBar } from '../src/components/MobileKeyboardBar';

const noop = () => {};
const EMOJI = new RegExp('\\p{Extended_Pictographic}', 'u');

describe('MobileKeyboardBar', () => {
  const training = renderToStaticMarkup(
    <MobileKeyboardBar onInsertChar={noop} onDoneTrigger={noop} onSubmit={noop} onOpenMan={noop} />
  );
  const blind = renderToStaticMarkup(
    <MobileKeyboardBar
      onInsertChar={noop}
      onDoneTrigger={noop}
      onSubmit={noop}
      onExitBlindTest={noop}
      isBlindTest
    />
  );

  it('gives every terminal symbol key an accessible pt-BR name', () => {
    for (const name of ['Hífen', 'Sublinhado', 'Barra', 'Pipe', 'Aspas', 'Cifrão', 'Dois-pontos', 'Redirecionamento', 'Tabulação']) {
      expect(training).toContain(`aria-label="${name}"`);
    }
  });

  it('uses no emoji in labels', () => {
    expect(training).not.toMatch(EMOJI);
    expect(blind).not.toMatch(EMOJI);
  });

  it('offers blind test and validation as the two primary actions while training', () => {
    expect(training).toMatch(/>Teste cego</);
    expect(training).toMatch(/>Validar</);
  });

  it('switches to reveal-reference and block validation during the blind test', () => {
    expect(blind).toMatch(/>Ver gabarito</);
    expect(blind).toMatch(/>Validar bloco</);
    expect(blind).not.toMatch(/>Teste cego</);
  });

  it('keeps every touch target at least 44px tall', () => {
    const buttons = training.match(/<button[^>]*>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) expect(b).toMatch(/min-h-\[(4[4-9]|5\d)px\]/);
  });
});
