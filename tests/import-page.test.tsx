import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImportScreen, ImportResultPanel } from '../src/components/ImportScreen';

describe('ImportScreen', () => {
  const html = renderToStaticMarkup(<ImportScreen prompt={'You write NetDrill content packs.\n[DESCRIBE THE TOPIC AND THE COMMANDS/PROCEDURES YOU WANT]'} />);

  it('offers copy prompt, validate and import actions', () => {
    expect(html).toMatch(/<button[^>]*>[\s\S]*?Copy prompt/);
    expect(html).toMatch(/<button[^>]*>Validate<\/button>/);
    expect(html).toMatch(/<button[^>]*>Import<\/button>/);
  });

  it('has a labelled editor and a file input', () => {
    expect(html).toMatch(/<label[^>]*for="pack-json"/);
    expect(html).toMatch(/<textarea[^>]*id="pack-json"/);
    expect(html).toMatch(/<input[^>]*type="file"[^>]*accept="application\/json,.json"/);
  });

  it('previews the prompt', () => {
    expect(html).toContain('You write NetDrill content packs.');
  });

  it('uses English copy only', () => {
    expect(html).not.toMatch(/[ãçõ]|Importar|Validar|Arquivo/);
  });
});

describe('ImportResultPanel', () => {
  it('shows counts and warnings for a dry run', () => {
    const html = renderToStaticMarkup(
      <ImportResultPanel
        result={{ ok: true, dryRun: true, summary: { documentsCreated: 4, documentsUpdated: 2, documentsRemoved: 0, drillsCreated: 11, drillsRemoved: 1 }, warnings: [{ path: 'procedures[0].uses[1]', message: 'Command "linux.grep" is not uploaded yet.' }] }}
      />
    );
    expect(html).toContain('Valid pack · nothing written yet');
    expect(html).toContain('Drills created');
    expect(html).toContain('11');
    expect(html).toContain('procedures[0].uses[1]: Command');
  });

  it('lists issues as path: message', () => {
    const html = renderToStaticMarkup(
      <ImportResultPanel result={{ ok: false, issues: [{ path: 'commands[0].name', message: 'Required' }, { path: '', message: 'The file is not valid JSON.' }] }} />
    );
    expect(html).toContain('commands[0].name: Required');
    expect(html).toContain('The file is not valid JSON.');
    expect(html).toMatch(/role="alert"/);
  });
});
