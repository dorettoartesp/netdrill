import { describe, it, expect } from 'vitest';
import { buildAuthoringPrompt, PROMPT_TOPIC_PLACEHOLDER } from '../src/lib/content/prompt';
import { validatePack, packJsonSchema } from '../src/lib/content/schema';

const prompt = buildAuthoringPrompt();

describe('buildAuthoringPrompt', () => {
  it('contains the topic placeholder and the format literal', () => {
    expect(PROMPT_TOPIC_PLACEHOLDER).toBe('[DESCRIBE THE TOPIC AND THE COMMANDS/PROCEDURES YOU WANT]');
    expect(prompt).toContain(PROMPT_TOPIC_PLACEHOLDER);
    expect(prompt).toContain('netdrill.pack/v1');
  });

  it('embeds the generated JSON Schema', () => {
    expect(prompt).toContain(JSON.stringify(packJsonSchema(), null, 2));
  });

  it('includes an example that passes validation without warnings', () => {
    const match = prompt.match(/<example>\n([\s\S]*?)\n<\/example>/);
    expect(match).not.toBeNull();
    const result = validatePack(JSON.parse(match![1]));
    expect(result.ok).toBe(true);
    expect(result.ok && result.warnings).toEqual([]);
  });

  it('states the authoring rules', () => {
    for (const rule of ['English', 'under 80 characters', '"drill": false', 'stable ids', 'Do not invent flags', 'Output only the JSON']) {
      expect(prompt).toContain(rule);
    }
  });
});
