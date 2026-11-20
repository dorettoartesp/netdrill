import { describe, it, expect } from 'vitest';
import { validatePack, packJsonSchema, PACK_FORMAT } from '../src/lib/content/schema';

/** Builds a minimal valid pack mirroring spec §5 (one command, one procedure). */
export function validPack(): any {
  return {
    format: 'netdrill.pack/v1',
    topic: { slug: 'linux', title: 'Linux Administration' },
    commands: [
      {
        id: 'linux.ss',
        name: 'ss',
        summary: 'Socket inspection via Netlink',
        synopsis: 'ss [options] [filter]',
        description: 'Modern netstat replacement.',
        examples: [
          {
            id: 'listening-sockets',
            title: 'Listening ports with process',
            scenario: 'List every listening TCP and UDP socket with the owning process.',
            command: 'ss -tulpn',
          },
        ],
      },
    ],
    procedures: [
      {
        id: 'linux.cgroup-oom-triage',
        title: 'Triage intermittent OOM',
        context: 'The API is OOM-killed under load.',
        steps: [{ command: 'cat /sys/fs/cgroup/api.service/memory.current', purpose: 'Current usage.' }],
      },
    ],
  };
}

function issuePaths(raw: unknown): string[] {
  const r = validatePack(raw);
  return r.ok ? [] : r.issues.map((i) => i.path);
}

describe('validatePack', () => {
  it('accepts the spec example and fills defaults', () => {
    const r = validatePack(validPack());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const cmd = r.pack.commands[0];
    expect(cmd.examples[0].drill).toBe(true);
    expect(cmd.flags).toEqual([]);
    expect(cmd.use_cases).toEqual([]);
    expect(cmd.examples[0].output_notes).toEqual([]);
    expect(r.pack.procedures[0].uses).toEqual([]);
    expect(r.pack.remove).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it('rejects a wrong format literal', () => {
    expect(issuePaths({ ...validPack(), format: 'netdrill.pack/v2' })).toContain('format');
  });

  it('reports nested paths', () => {
    const p = validPack();
    delete p.commands[0].examples[0].command;
    expect(issuePaths(p)).toContain('commands[0].examples[0].command');
  });

  it('requires ids to start with the topic slug', () => {
    const p = validPack();
    p.commands[0].id = 'redes.ss';
    expect(issuePaths(p)).toContain('commands[0].id');
  });

  it('rejects duplicate ids across commands and procedures', () => {
    const p = validPack();
    p.procedures[0].id = 'linux.ss';
    expect(issuePaths(p)).toContain('procedures[0].id');
  });

  it('rejects duplicate example ids within a command', () => {
    const p = validPack();
    p.commands[0].examples.push({ ...p.commands[0].examples[0] });
    expect(issuePaths(p)).toContain('commands[0].examples[1].id');
  });

  it('rejects an id that is both upserted and removed', () => {
    const p = validPack();
    p.remove = ['linux.ss'];
    expect(issuePaths(p)).toContain('remove[0]');
  });

  it('requires at least one of commands, procedures or remove', () => {
    const p = validPack();
    delete p.commands;
    delete p.procedures;
    expect(issuePaths(p)).toContain('');
  });

  it('rejects a non-object payload at the root', () => {
    expect(issuePaths([])).toContain('');
    expect(issuePaths('x')).toContain('');
  });

  it('warns on long drill lines', () => {
    const long = 'curl -sS -o /dev/null -w "connect=%{time_connect} ttfb=%{time_starttransfer} total=%{time_total}\\n" http://127.0.0.1:8000/health';
    expect(long.length).toBe(128);
    const p = validPack();
    p.commands[0].examples[0].command = long;
    const r = validatePack(p);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0].path).toBe('commands[0].examples[0].command');
    expect(r.warnings[0].message).toContain('long drill line (128 chars)');

    p.commands[0].examples[0].drill = false;
    const r2 = validatePack(p);
    expect(r2.ok && r2.warnings).toEqual([]);
  });

  it('checks each line of a multi-line step separately', () => {
    const p = validPack();
    p.procedures[0].steps[0].command = `config system interface\n    edit "port1"\n${'x'.repeat(101)}\nend`;
    const r = validatePack(p);
    expect(r.ok && r.warnings.map((w) => w.path)).toEqual(['procedures[0].steps[0].command']);
  });
});

describe('packJsonSchema', () => {
  it('exposes the format literal', () => {
    expect(PACK_FORMAT).toBe('netdrill.pack/v1');
    expect(JSON.stringify(packJsonSchema())).toContain('"netdrill.pack/v1"');
  });
});
