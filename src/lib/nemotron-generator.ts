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
 * Validates that an object conforms to the strict ManPage schema,
 * ensuring all required strings and arrays are non-empty.
 */
export function validateManPageSchema(obj: unknown): asserts obj is ManPage {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('Resposta do modelo não é um objeto JSON válido');
  }

  const candidate = obj as Record<string, unknown>;

  const checkNonEmptyString = (field: string) => {
    const val = candidate[field];
    if (typeof val !== 'string' || !val.trim()) {
      throw new Error(`Campo obrigatório ausente ou vazio: ${field}`);
    }
  };

  checkNonEmptyString('command');
  checkNonEmptyString('title');
  checkNonEmptyString('sectionName');
  checkNonEmptyString('synopsis');
  checkNonEmptyString('description');

  if (!Array.isArray(candidate.options) || candidate.options.length === 0) {
    throw new Error('Campo "options" deve ser uma lista não vazia de opções');
  }

  for (const opt of candidate.options) {
    if (typeof opt !== 'string' || !opt.trim()) {
      throw new Error('Item inválido em "options": deve ser uma string não vazia');
    }
  }

  if (!Array.isArray(candidate.examples) || candidate.examples.length === 0) {
    throw new Error('Campo "examples" deve ser uma lista não vazia de exemplos');
  }

  for (const ex of candidate.examples) {
    if (typeof ex !== 'string' || !ex.trim()) {
      throw new Error('Item inválido em "examples": deve ser uma string não vazia');
    }
  }
}

/**
 * Extracts and parses JSON from raw LLM output, safely stripping markdown fences
 * and reasoning tags like <think>...</think>.
 */
export function extractJsonFromResponse(rawContent: string): unknown {
  // Strip reasoning / think tags
  const withoutThinking = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Strip markdown fences
  let sanitized = withoutThinking
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // If there is still surrounding text, isolate the outermost JSON object
  const firstBrace = sanitized.indexOf('{');
  const lastBrace = sanitized.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    sanitized = sanitized.slice(firstBrace, lastBrace + 1);
  }

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
    throw new Error('Serviço de geração por IA temporariamente indisponível.');
  }

  const cleanCmd = command.trim().toLowerCase().split(/\s+/)[0];
  if (!cleanCmd || !/^[a-z0-9][a-z0-9._+-]{0,63}$/i.test(cleanCmd)) {
    throw new Error(`Comando inválido para documentação: ${cleanCmd}`);
  }

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
      console.error(`[Nemotron] Upstream error: status ${res.status}, body: ${errorText}`);
      throw new Error(`Falha na comunicação com o modelo de inteligência artificial (status ${res.status}).`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Resposta vazia recebida do modelo de IA');
    }

    const parsed = extractJsonFromResponse(rawContent) as Record<string, unknown>;
    if (parsed && parsed.notFound === true) {
      return { notFound: true };
    }

    validateManPageSchema(parsed);

    return {
      command: cleanCmd, // Pin to cleanCmd to prevent LLM normalization miskeying the cache
      title: parsed.title,
      sectionName: parsed.sectionName,
      synopsis: parsed.synopsis,
      description: parsed.description,
      options: parsed.options,
      examples: parsed.examples,
      source: 'ai_nemotron'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
