import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Seed Data Verification', () => {
  it('should have valid seed-data.json with at least 30 exercises across Linux, Redes and FortiGate', () => {
    const seedPath = path.join(__dirname, '../src/data/seed-data.json');
    expect(fs.existsSync(seedPath)).toBe(true);

    const raw = fs.readFileSync(seedPath, 'utf-8');
    const datasets = JSON.parse(raw);
    expect(Array.isArray(datasets)).toBe(true);

    let totalItems = 0;
    const topicsFound = new Set<string>();

    for (const data of datasets) {
      expect(data.topic).toBeDefined();
      expect(data.module).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
      topicsFound.add(data.topic);
      totalItems += data.items.length;

      for (const item of data.items) {
        expect(item.type).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.prompt).toBeDefined();
        expect(item.target).toBeDefined();
        expect(item.output_sample).toBeDefined();
        expect(item.explanation).toBeDefined();
      }
    }

    expect(topicsFound.has('linux')).toBe(true);
    expect(topicsFound.has('redes')).toBe(true);
    expect(topicsFound.has('fortigate')).toBe(true);
    expect(totalItems).toBeGreaterThanOrEqual(30);
  });
});
