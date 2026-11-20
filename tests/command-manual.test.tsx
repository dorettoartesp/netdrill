import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ManualEntryView } from '../src/components/manual/ManualEntryView';
import { validatePack } from '../src/lib/content/schema';
import type { DocumentEntry, DocumentSummary } from '../src/lib/content/catalog';
import { linuxPack } from './fixtures/content';

const r = validatePack(linuxPack());
if (!r.ok) throw new Error('fixture invalid');
const ss = r.pack.commands[0];
const oom = r.pack.procedures[0];
const sum = (id: string, kind: 'command' | 'procedure', name: string): DocumentSummary => ({ id, kind, topicSlug: 'linux', name, summary: 's' });

const commandEntry: DocumentEntry = {
  summary: sum('linux.ss', 'command', 'ss'),
  body: { ...ss, examples: [{ ...ss.examples[0], output: 'Netid State' }, ss.examples[1]] },
  uses: [],
  usedBy: [sum('linux.oom', 'procedure', 'OOM triage')],
  related: [],
  relatedBy: [],
};
const procedureEntry: DocumentEntry = {
  summary: sum('linux.oom', 'procedure', 'OOM triage'),
  body: oom,
  uses: [sum('linux.ss', 'command', 'ss')],
  usedBy: [],
  related: [],
  relatedBy: [],
};

describe('ManualEntryView (command)', () => {
  const html = renderToStaticMarkup(<ManualEntryView entry={commandEntry} />);

  it('renders the flags table', () => {
    expect(html).toMatch(/<th[^>]*>Flag<\/th>/);
    expect(html).toMatch(/<th[^>]*>Description<\/th>/);
    expect(html).toContain('-t, --tcp');
    expect(html).toContain('TCP sockets only.');
  });

  it('renders examples with their output', () => {
    expect(html).toContain('$ ss -tulpn');
    expect(html).toContain('Netid State');
  });

  it('links the procedures that use the command', () => {
    expect(html).toContain('Used in procedures');
    expect(html).toMatch(/href="\/man\/linux\.oom"/);
  });

  it('offers practice for the topic', () => {
    expect(html).toMatch(/href="\/\?topics=linux"[^>]*>Practice/);
  });

  it('has no AI wording', () => {
    expect(html).not.toMatch(/\bAI\b|Nemotron|Regenerate/);
  });
});

describe('ManualEntryView (procedure)', () => {
  const html = renderToStaticMarkup(<ManualEntryView entry={procedureEntry} />);

  it('renders numbered steps', () => {
    expect(html).toContain('Step 1');
    expect(html).toContain('$ cat memory.current');
    expect(html).toContain('Step 2');
  });

  it('links the commands used', () => {
    expect(html).toContain('Commands used');
    expect(html).toMatch(/href="\/man\/linux\.ss"/);
  });
});
