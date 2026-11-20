import { ManPage } from '@/data/man';

export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
export const NEMOTRON_MODEL = 'nvidia/nemotron-3.5-super-vl:free';

export interface GeneratedManPage extends ManPage {
  source?: 'ai_nemotron';
}

export interface NemotronNotFound {
  notFound: true;
}

/**
 * Extracts and parses JSON from raw LLM output, safely stripping markdown fences.
 */
export function extractJsonFromResponse(rawContent: string): unknown {
  const sanitized = rawContent
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(sanitized);
}

/**
 * Calls OpenRouter Nemotron to dynamically synthesize a Linux manpage in structured JSON.
 */
export async function generateManPageWithNemotron(
  command: string,
  apiKey?: string
): Promise<GeneratedManPage | NemotronNotFound> {
  const resolvedKey = apiKey || process.env.OPENROUTER_API_KEY;
  if (!resolvedKey) {
    throw new Error('OPENROUTER_API_KEY não configurada. Defina a chave no .env.local ou variáveis da Vercel.');
  }

  const cleanCmd = command.trim().toLowerCase().split(/\s+/)[0];

  const systemPrompt = `Você é um especialista sênior em engenharia de sistemas Linux, DevOps e SRE do NetDrill.
Sua missão é gerar páginas de manual do Linux (manpages) estruturadas em formato JSON estrito, prontas para consumo por um leitor de terminal.

Regras de Saída:
1. Responda ESTRITAMENTE com um objeto JSON válido, sem introduções, sem markdown de bloco de código (sem \`\`\`json), apenas o JSON puro.
2. Se o termo solicitado NÃO FOR um comando, utilitário, chamada de sistema ou pacote real do ecossistema Linux/POSIX (ex: strings aleatórias ou digitações incorretas), responda estritamente com: {"notFound": true, "error": "Comando desconhecido no ecossistema Linux"}
3. As explicações devem ser em Português do Brasil formal e técnico.
4. As flags, comandos e termos canônicos de infraestrutura (daemons, sockets, kernel, signals, etc.) devem ser mantidos em inglês técnico.
5. Os exemplos práticos devem refletir cenários reais de incidentes e troubleshooting de produção (SRE/DevOps).

Estrutura JSON Obrigatória para comandos válidos:
{
  "command": "${cleanCmd}",
  "title": "${cleanCmd} - resumo conciso em uma linha",
  "sectionName": "1 (Comandos de Usuário) ou 8 (Administração do Sistema)",
  "synopsis": "sintaxe canônica do comando com opções e argumentos",
  "description": "parágrafo técnico explicando o que a ferramenta faz, seu papel no kernel/sistema e quando usá-la",
  "options": [
    "-flag : explicação técnica detalhada do impacto da opção em produção"
  ],
  "examples": [
    "${cleanCmd} [argumentos...] # explicação do cenário de produção"
  ]
}`;

  const userPrompt = `Gere a documentação oficial estruturada para o comando Linux: ${cleanCmd}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedKey}`,
        'HTTP-Referer': 'https://netdrill-nine.vercel.app',
        'X-Title': 'NetDrill Linux Manual'
      },
      body: JSON.stringify({
        model: NEMOTRON_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1500
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`OpenRouter API respondeu com status ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Resposta vazia recebida do modelo Nemotron');
    }

    const parsed = extractJsonFromResponse(rawContent) as Record<string, unknown>;
    if (parsed && parsed.notFound === true) {
      return { notFound: true };
    }

    if (!parsed || !parsed.command || !parsed.title || !parsed.description) {
      throw new Error('JSON retornado pelo Nemotron não contém os campos obrigatórios da manpage');
    }

    return {
      command: String(parsed.command).toLowerCase(),
      title: String(parsed.title),
      sectionName: String(parsed.sectionName || '1 (Comandos de Usuário)'),
      synopsis: String(parsed.synopsis || parsed.command),
      description: String(parsed.description),
      options: Array.isArray(parsed.options) ? parsed.options.map(String) : [],
      examples: Array.isArray(parsed.examples) ? parsed.examples.map(String) : [],
      source: 'ai_nemotron'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
