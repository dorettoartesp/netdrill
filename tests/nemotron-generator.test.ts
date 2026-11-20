import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateManPageWithNemotron,
  extractJsonFromResponse,
  validateManPageSchema
} from '../src/lib/nemotron-generator';

describe('OpenRouter Nemotron JIT Generator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should cleanly strip markdown fences and <think> reasoning tags from raw LLM output', () => {
    const raw = '<think>Generating manual for jq...</think>\n```json\n{\n  "command": "jq",\n  "title": "jq - processador de JSON",\n  "sectionName": "1 (Comandos de Usuário)",\n  "synopsis": "jq [opções] filtro [arquivo...]",\n  "description": "Filtra e transforma streams JSON.",\n  "options": ["-r : Saída em texto puro"],\n  "examples": ["cat dados.json | jq .items"]\n}\n```';
    const parsed = extractJsonFromResponse(raw) as any;
    expect(parsed.command).toBe('jq');
    expect(parsed.options).toHaveLength(1);
  });

  it('should validate mandatory fields and reject incomplete schemas', () => {
    expect(() => validateManPageSchema({})).toThrow();
    expect(() => validateManPageSchema({ command: 'jq', title: '   ', description: '' })).toThrow();
    expect(() => validateManPageSchema({
      command: 'jq',
      title: 'jq',
      sectionName: '1',
      synopsis: 'jq',
      description: 'desc',
      options: [],
      examples: []
    })).toThrow();
  });

  it('should detect when LLM returns notFound: true for invalid commands', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({ notFound: true, error: 'Comando inexistente no Linux' })
            }
          }
        ]
      })
    });
    global.fetch = mockFetch;

    const result = await generateManPageWithNemotron('fakeasdf123', 'fake-key');
    expect(result).toEqual({ notFound: true });
  });

  it('should pin the clean requested command even if LLM normalizes or alters it', async () => {
    const mockManData = {
      command: 'mkfs',
      title: 'mkfs.ext4 - cria sistema de arquivos ext4',
      sectionName: '8 (Comandos de Administração)',
      synopsis: 'mkfs.ext4 [opções] dispositivo',
      description: 'Cria um sistema de arquivos ext4 no Linux.',
      options: ['-b tamanho : Tamanho do bloco'],
      examples: ['mkfs.ext4 /dev/sdb1']
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify(mockManData)
            }
          }
        ]
      })
    });
    global.fetch = mockFetch;

    const result = await generateManPageWithNemotron('mkfs.ext4', 'fake-key');
    expect('command' in result).toBe(true);
    if ('command' in result) {
      expect(result.command).toBe('mkfs.ext4');
      expect(result.source).toBe('ai_nemotron');
    }
  });

  it('should throw an error if API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(generateManPageWithNemotron('rsync', '')).rejects.toThrow();
  });
});
