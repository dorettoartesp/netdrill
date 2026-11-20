import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StudyTypingLayout } from '../src/components/StudyTypingLayout';

describe('StudyTypingLayout', () => {
  it('pins the session to the visible area above the keyboard while typing', () => {
    const html = renderToStaticMarkup(
      <StudyTypingLayout isTyping visibleHeight={470} offsetTop={0}>
        <p>content</p>
      </StudyTypingLayout>
    );
    expect(html).toMatch(/class="[^"]*fixed inset-x-0[^"]*"/);
    expect(html).toMatch(/style="[^"]*top:0px;height:470px/);
    expect(html).toContain('<p>content</p>');
  });

  it('follows the visual viewport offset when the page is panned', () => {
    const html = renderToStaticMarkup(
      <StudyTypingLayout isTyping visibleHeight={420} offsetTop={60}>
        <p>x</p>
      </StudyTypingLayout>
    );
    expect(html).toMatch(/top:60px;height:420px/);
  });

  it('renders a plain wrapper when not typing', () => {
    const html = renderToStaticMarkup(
      <StudyTypingLayout isTyping={false} visibleHeight={470} offsetTop={0}>
        <p>content</p>
      </StudyTypingLayout>
    );
    expect(html).not.toContain('fixed');
    expect(html).not.toContain('height:470px');
  });
});
