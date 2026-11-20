import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateManPageWithNemotron, extractJsonFromResponse } from '../src/lib/nemotron-generator';

describe('OpenRouter Nemotron JIT Generator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should cleanly strip markdown fences from raw LLM output', () => {
    const raw = '```json\n{\n  "command": "jq",\n  "title": "jq - processador de JSON",\n  "sectionName": "1 (Comandos de Usuário)",\n  "synopsis": "jq [opções] filtro [arquivo...]",\n  "description": "Filtra e transforma streams JSON.",\n  "options": ["-r : Saída em texto puro"],\n  "examples": ["cat dados.json | jq .items"]\n}\n```';
    const parsed = extractJsonFromResponse(raw) as any;
    expect(parsed.command).toBe('jq');
    expect(parsed.options).toHaveLength(1);
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

  it('should successfully parse valid generation and return formatted ManPage', async () => {
    const mockManData = {
      command: 'rsync',
      title: 'rsync - sincronizador rápido de arquivos',
      sectionName: '1 (Comandos de Usuário)',
      synopsis: 'rsync [opções] origem destino',
      description: 'Sincroniza diretórios e arquivos remota e localmente.',
      options: ['-a : Arquivo', '-v : Verboso'],
      examples: ['rsync -avz src/ dst/']
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

    const result = await generateManPageWithNemotron('rsync', 'fake-key');
    expect('command' in result).toBe(true);
    if ('command' in result) {
      expect(result.command).toBe('rsync');
      expect(result.options).toHaveLength(2);
      expect(result.source).toBe('ai_nemotron');
    }
  });

  it('should throw an error if API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(generateManPageWithNemotron('rsync', '')).rejects.toThrow('OPENROUTER_API_KEY');
  });
});
