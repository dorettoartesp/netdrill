import { describe, it, expect } from 'vitest';
import { parseAnnotatedOutput, GLOBAL_TELEMETRY_GLOSSARY } from '../src/lib/telemetry-glossary';

describe('Telemetry Glossary & Output Parser', () => {
  it('should export GLOBAL_TELEMETRY_GLOSSARY with essential sysadmin metrics', () => {
    expect(GLOBAL_TELEMETRY_GLOSSARY).toBeDefined();
    expect(GLOBAL_TELEMETRY_GLOSSARY['%cpu']).toBeDefined();
    expect(GLOBAL_TELEMETRY_GLOSSARY['stat_d']).toBeDefined();
    expect(GLOBAL_TELEMETRY_GLOSSARY['wa%']).toBeDefined();
    expect(GLOBAL_TELEMETRY_GLOSSARY['recv-q']).toBeDefined();
  });

  it('should recognize universal tokens like %CPU and STAT D in raw output', () => {
    const raw = 'USER PID %CPU STAT COMMAND\napp 3100 85.4 D java';
    const parsed = parseAnnotatedOutput(raw);

    expect(parsed.activeMetrics).toHaveProperty('stat_d');
    expect(parsed.activeMetrics.stat_d.label).toContain('Uninterruptible Sleep');
    const dSegment = parsed.segments.find((s) => s.text === 'D');
    expect(dSegment?.metricKey).toBe('stat_d');
    expect(dSegment?.isAlert).toBe(true);
  });

  it('should allow customNotes to override and augment global glossary', () => {
    const raw = 'port2 192.168.10.1 nat: enable';
    const custom = JSON.stringify([
      {
        token: 'nat: enable',
        label: 'NAT Ativo',
        severity: 'info',
        description: 'Mascaramento de saída',
        normalBaseline: 'enable',
        anomalyAlert: 'disable'
      }
    ]);
    const parsed = parseAnnotatedOutput(raw, custom);
    expect(parsed.activeMetrics).toHaveProperty('nat_enable');
    expect(parsed.activeMetrics.nat_enable.label).toBe('NAT Ativo');
  });

  it('should safely handle regex metacharacters in tokens like %, +, [, ], :', () => {
    const raw = 'PID USER TIME+ COMMAND\n100 root 12:34.56 nginx';
    const parsed = parseAnnotatedOutput(raw);
    expect(parsed.activeMetrics).toHaveProperty('time+');
  });

  it('should gracefully handle malformed JSON in customNotes without throwing', () => {
    const raw = 'eth0 UP 1000Mbps';
    expect(() => parseAnnotatedOutput(raw, '{malformed json')).not.toThrow();
    const result = parseAnnotatedOutput(raw, '{malformed json');
    expect(result.segments.length).toBeGreaterThan(0);
  });

  it('should handle empty or null outputSample gracefully', () => {
    const result1 = parseAnnotatedOutput('');
    expect(result1.segments).toEqual([]);
    expect(result1.activeMetrics).toEqual({});

    const result2 = parseAnnotatedOutput(null as unknown as string);
    expect(result2.segments).toEqual([]);
    expect(result2.activeMetrics).toEqual({});
  });
});
