import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { UseCaseList } from '../src/components/UseCaseList';

describe('UseCaseList', () => {
  it('shows an empty message instead of fabricated use cases', () => {
    const html = renderToStaticMarkup(<UseCaseList useCases={[]} target="ss -tulpn" />);
    expect(html).toContain('No use cases recorded for this command.');
  });

  it('renders each use case with its severity label and the command', () => {
    const html = renderToStaticMarkup(
      <UseCaseList
        target="ss -tulpn"
        useCases={[
          { title: 'Port down', situation: 'After deploy', severity: 'incident' },
          { title: 'Breach', situation: 'Unknown listener', severity: 'critical' },
          { title: 'Audit', situation: 'Weekly check', severity: 'routine' },
        ]}
      />
    );
    for (const text of ['Port down', 'After deploy', 'Incident', 'Critical', 'Routine', '$ ss -tulpn']) {
      expect(html).toContain(text);
    }
  });
});
