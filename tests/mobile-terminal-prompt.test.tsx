import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TerminalPrompt } from '../src/components/TerminalPrompt';

const noop = () => {};

function renderSingleLine(extra: Partial<React.ComponentProps<typeof TerminalPrompt>> = {}) {
  return renderToStaticMarkup(
    <TerminalPrompt
      isMultiLine={false}
      target={'curl -sS -o /dev/null -w "connect=%{time_connect}\\n" http://127.0.0.1:8000/health'}
      value=""
      onChange={noop}
      onSubmit={noop}
      onExitTrigger={noop}
      {...extra}
    />
  );
}

describe('TerminalPrompt (single-line, mobile)', () => {
  it('renders a wrapping textarea instead of a one-line input so long commands stay visible', () => {
    const html = renderSingleLine();
    expect(html).not.toMatch(/<input[^>]*type="text"/);
    expect(html).toMatch(/<textarea[^>]*whitespace-pre-wrap/);
    expect(html).toMatch(/<textarea[^>]*break-all/);
  });

  it('disables iOS autocorrection and shows a send key on the virtual keyboard', () => {
    const html = renderSingleLine();
    expect(html).toMatch(/<textarea[^>]*enterKeyHint="send"/i);
    expect(html).toMatch(/<textarea[^>]*autoCorrect="off"/i);
    expect(html).toMatch(/<textarea[^>]*autoCapitalize="none"/i);
  });

  it('wraps the reference command instead of overflowing the screen', () => {
    const html = renderSingleLine();
    expect(html).toMatch(/<code[^>]*whitespace-pre-wrap[^>]*break-all[^>]*>curl/);
  });

  it('labels the command field for assistive technologies', () => {
    const html = renderSingleLine();
    expect(html).toMatch(/<label[^>]*for="terminal-command"/);
    expect(html).toMatch(/<textarea[^>]*id="terminal-command"/);
  });
});

describe('TerminalPrompt (multi-line, mobile)', () => {
  const block = 'config system interface\n    edit "port1"\n        set ip 192.168.10.1 255.255.255.0\n    next\nend';
  const html = renderToStaticMarkup(
    <TerminalPrompt
      isMultiLine
      target={block}
      value=""
      onChange={noop}
      onSubmit={noop}
      onExitTrigger={noop}
    />
  );

  it('wraps the reference block on small screens while keeping indentation', () => {
    expect(html).toMatch(/<pre[^>]*whitespace-pre-wrap[^>]*break-all[^>]*lg:whitespace-pre/);
  });

  it('does not force a 260px minimum height on small screens', () => {
    expect(html).not.toMatch(/min-height:\s*260px/);
    expect(html).toMatch(/lg:min-h-\[var\(--ref-min-h\)\]/);
    expect(html).toMatch(/--ref-min-h:\s*260px/);
  });

  it('hides the desktop action bar on small screens (the mobile dock provides the actions)', () => {
    expect(html).toMatch(/class="hidden lg:flex[^"]*"[^>]*><div[^>]*>[\s\S]*Validar Bloco/);
  });
});
