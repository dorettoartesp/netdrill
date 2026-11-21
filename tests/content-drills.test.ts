import { describe, it, expect } from 'vitest';
import { validatePack, CommandDoc, ProcedureDoc } from '../src/lib/content/schema';
import { drillRefsFor, deriveDrillContent } from '../src/lib/content/drills';

function parse(raw: any) {
  const r = validatePack(raw);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.pack;
}

const pack = parse({
  format: 'netdrill.pack/v1',
  topic: { slug: 'linux', title: 'Linux' },
  commands: [
    {
      id: 'linux.ss',
      name: 'ss',
      summary: 's',
      synopsis: 'ss [options]',
      description: 'd',
      use_cases: [{ title: 'Port down', situation: 'After deploy', severity: 'incident' }],
      examples: [
        { id: 'listening', title: 'Listening', scenario: 'List listening sockets.', command: 'ss -tulpn', explanation: 'flags', output: 'Netid State', output_notes: [{ token: 'State', meaning: 'm' }] },
        { id: 'reference', title: 'Ref', scenario: 'Ref only', command: 'ss -s', drill: false },
      ],
    },
  ],
  procedures: [
    {
      id: 'linux.oom',
      title: 'OOM triage',
      context: 'API is OOM-killed.',
      goal: 'Compare usage and limit.',
      use_cases: [{ title: 'Nightly OOM', situation: 's', severity: 'critical' }],
      steps: [
        { command: 'cat memory.current', purpose: 'usage', output: '100', output_notes: [{ token: '100', meaning: 'bytes' }] },
        { command: 'cat memory.max', purpose: 'limit' },
      ],
    },
    {
      id: 'linux.forti-port',
      title: 'Port IP',
      context: 'Set IP on port1.',
      steps: [{ command: 'config system interface\n    edit "port1"\n        set ip 10.0.0.1 255.255.255.0\n    next\nend', purpose: 'configure' }],
    },
  ],
});

const ss = pack.commands[0] as CommandDoc;
const oom = pack.procedures[0] as ProcedureDoc;
const forti = pack.procedures[1] as ProcedureDoc;

describe('drillRefsFor', () => {
  it('creates one drill per drillable example with a stable id', () => {
    expect(drillRefsFor(ss, 'command')).toEqual([{ id: 'linux.ss#listening', kind: 'example', position: 0 }]);
  });

  it('creates one drill per procedure using the document id', () => {
    expect(drillRefsFor(oom, 'procedure')).toEqual([{ id: 'linux.oom', kind: 'procedure', position: 0 }]);
  });
});

describe('deriveDrillContent', () => {
  it('maps an example drill', () => {
    const c = deriveDrillContent({ id: 'linux.ss#listening', kind: 'example', position: 0 }, ss);
    expect(c).toMatchObject({
      title: 'Listening',
      prompt: 'List listening sockets.',
      target: 'ss -tulpn',
      isMultiLine: false,
      explanation: 'flags',
      output: 'Netid State',
    });
    expect(c.outputNotes.map((n) => n.token)).toEqual(['State']);
    expect(c.useCases.map((u) => u.title)).toEqual(['Port down']);
  });

  it('maps a procedure drill', () => {
    const c = deriveDrillContent({ id: 'linux.oom', kind: 'procedure', position: 0 }, oom);
    expect(c.prompt).toBe('API is OOM-killed.\n\nGoal: Compare usage and limit.');
    expect(c.target).toBe('cat memory.current\ncat memory.max');
    expect(c.isMultiLine).toBe(true);
    expect(c.output).toBe('100');
    expect(c.outputNotes.map((n) => n.token)).toEqual(['100']);
    expect(c.useCases.map((u) => u.title)).toEqual(['Nightly OOM']);
  });

  it('omits the goal line when absent', () => {
    expect(deriveDrillContent({ id: 'linux.forti-port', kind: 'procedure', position: 0 }, forti).prompt).toBe('Set IP on port1.');
  });

  it('keeps indentation of multi-line FortiOS steps', () => {
    const c = deriveDrillContent({ id: 'linux.forti-port', kind: 'procedure', position: 0 }, forti);
    expect(c.target).toContain('\n    edit "port1"\n        set ip');
    expect(c.isMultiLine).toBe(true);
  });

  it('throws for an unknown example id', () => {
    expect(() => deriveDrillContent({ id: 'linux.ss#missing', kind: 'example', position: 0 }, ss)).toThrow();
  });
});

describe('deriveDrillContent no_output', () => {
  it('marks examples that print nothing on success', () => {
    const p = parse({
      format: 'netdrill.pack/v1', topic: { slug: 'linux', title: 'Linux' },
      commands: [{ id: 'linux.chmod', name: 'chmod', summary: 's', synopsis: 'chmod', description: 'd',
        examples: [{ id: 'x', title: 'x', scenario: 's', command: 'chmod 600 key', no_output: true }] }],
    });
    expect(deriveDrillContent({ id: 'linux.chmod#x', kind: 'example', position: 0 }, p.commands[0]).noOutput).toBe(true);
  });

  it('marks a procedure silent only when every step is silent', () => {
    expect(deriveDrillContent({ id: 'linux.oom', kind: 'procedure', position: 0 }, oom).noOutput).toBe(false);
  });
});
