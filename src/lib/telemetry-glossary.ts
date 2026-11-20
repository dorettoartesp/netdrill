export interface MetricDefinition {
  token: string;
  key?: string;
  label: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
  normalBaseline: string;
  anomalyAlert: string;
  alternativeTokens?: string[];
}

export interface OutputSegment {
  text: string;
  metricKey?: string;
  isAlert?: boolean;
}

export interface ParsedAnnotatedOutput {
  segments: OutputSegment[];
  activeMetrics: Record<string, MetricDefinition>;
}

export const GLOBAL_TELEMETRY_GLOSSARY: Record<string, MetricDefinition> = {
  '%cpu': {
    token: '%CPU',
    key: '%cpu',
    label: '%CPU (% de Utilização do Processador)',
    severity: 'warning',
    description: 'Percentual de tempo de processador consumido pelo processo.',
    normalBaseline: '< 70% sob carga típica',
    anomalyAlert: '> 90% contínuo ou 100% fixo (loop infinito de thread/processo)'
  },
  '%mem': {
    token: '%MEM',
    key: '%mem',
    label: '%MEM (% de Memória RAM Física)',
    severity: 'warning',
    description: 'Percentual da memória física real (RAM) ocupado pelo processo.',
    normalBaseline: '< 60% por processo',
    anomalyAlert: 'Crescimento contínuo sem desalocação (vazamento de memória / memory leak)'
  },
  rss: {
    token: 'RSS',
    key: 'rss',
    label: 'RSS (Resident Set Size)',
    severity: 'info',
    description: 'Quantidade exata de memória RAM física alocada atualmente em kilobytes.',
    normalBaseline: 'Estável após aquecimento da aplicação',
    anomalyAlert: 'Aumento linear contínuo precedendo OOM Killer'
  },
  'time+': {
    token: 'TIME+',
    key: 'time+',
    label: 'TIME+ (Tempo Acumulado de CPU)',
    severity: 'info',
    description: 'Tempo total acumulado de processamento que o processo usou desde o boot.',
    normalBaseline: 'Crescimento proporcional ao uptime',
    anomalyAlert: 'Crescimento vertiginoso em curto intervalo (processamento em loop)'
  },
  stat_d: {
    token: 'D',
    key: 'stat_d',
    label: 'STAT D (Uninterruptible Sleep / D-State)',
    severity: 'critical',
    description: 'Processo travado aguardando I/O de disco ou chamada síncrona NFS. Não responde a SIGKILL.',
    normalBaseline: 'Inexistente ou transições em milissegundos',
    anomalyAlert: 'D persistente: storage indisponível, disco físico corrompido ou NFS travado'
  },
  stat_z: {
    token: 'Z',
    key: 'stat_z',
    label: 'STAT Z (Zombie Process)',
    severity: 'critical',
    description: 'Processo finalizado cuja entrada na tabela de processos ainda não foi recolhida pelo processo pai.',
    normalBaseline: '0 processos zumbis',
    anomalyAlert: 'Acúmulo de zumbis esgotando a tabela máxima de PIDs do kernel (PID exhaustion)'
  },
  stat_r: {
    token: 'R',
    key: 'stat_r',
    label: 'STAT R (Running / Runnable)',
    severity: 'info',
    description: 'Processo em execução ativa na CPU ou aguardando na fila de escalonamento.',
    normalBaseline: 'Menor ou igual ao número de vCPUs disponíveis',
    anomalyAlert: 'Muito superior ao número de núcleos: CPU saturation e alto Load Average'
  },
  stat_s: {
    token: 'S',
    key: 'stat_s',
    label: 'STAT S (Interruptible Sleep)',
    severity: 'info',
    description: 'Processo dormindo aguardando um evento externo, I/O ou sinal.',
    normalBaseline: 'Estado padrão da vasta maioria dos daemons e workers ociosos',
    anomalyAlert: 'Nenhum'
  },
  'wa%': {
    token: 'wa%',
    key: 'wa%',
    alternativeTokens: ['wa'],
    label: 'wa% (I/O Wait da CPU)',
    severity: 'critical',
    description: 'Percentual de tempo em que a CPU esteve ociosa aguardando resposta de discos ou rede.',
    normalBaseline: '< 5%',
    anomalyAlert: '> 20% gargalo severo em I/O de disco, SAN saturada ou fila de gravação travada'
  },
  'recv-q': {
    token: 'Recv-Q',
    key: 'recv-q',
    label: 'Recv-Q (Fila de Recepção de Socket TCP)',
    severity: 'warning',
    description: 'Quantidade de bytes já recebidos pelo kernel mas ainda não consumidos pela aplicação.',
    normalBaseline: '0',
    anomalyAlert: '> 0 constante indica aplicação bloqueada, thread pool esgotada ou starvation'
  },
  'send-q': {
    token: 'Send-Q',
    key: 'send-q',
    label: 'Send-Q (Fila de Envio de Socket TCP)',
    severity: 'warning',
    description: 'Bytes enviados pela aplicação mas ainda não confirmados com ACK pelo destino.',
    normalBaseline: '0',
    anomalyAlert: '> 0 constante indica saturação no enlace de rede ou receptor congestionado'
  },
  listen: {
    token: 'LISTEN',
    key: 'listen',
    label: 'LISTEN (Porta TCP Aberta)',
    severity: 'info',
    description: 'Socket aberto aguardando ativamente conexões TCP de clientes.',
    normalBaseline: 'Apenas serviços conhecidos e homologados',
    anomalyAlert: 'Porta desconhecida em 0.0.0.0 / ::: (possível backdoor ou serviço indevido)'
  }
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deriveKey(token: string): string {
  return token
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

interface MatchCandidate {
  start: number;
  end: number;
  text: string;
  metricKey: string;
  metric: MetricDefinition;
}

export function parseAnnotatedOutput(
  outputSample: string | null | undefined,
  customNotes?: string | Array<Partial<MetricDefinition>> | null
): ParsedAnnotatedOutput {
  if (!outputSample || typeof outputSample !== 'string') {
    return { segments: [], activeMetrics: {} };
  }

  // Merge custom definitions into glossary
  const glossaryMap: Map<string, MetricDefinition> = new Map();
  for (const [k, v] of Object.entries(GLOBAL_TELEMETRY_GLOSSARY)) {
    glossaryMap.set(k, { ...v, key: v.key || k });
  }

  if (customNotes) {
    try {
      const parsedNotes =
        typeof customNotes === 'string' ? JSON.parse(customNotes) : customNotes;
      if (Array.isArray(parsedNotes)) {
        for (const item of parsedNotes) {
          if (item && item.token && item.label) {
            const key = item.key || deriveKey(item.token);
            glossaryMap.set(key, {
              token: item.token,
              key,
              label: item.label,
              severity: item.severity || 'info',
              description: item.description || '',
              normalBaseline: item.normalBaseline || '',
              anomalyAlert: item.anomalyAlert || '',
              alternativeTokens: item.alternativeTokens
            });
          }
        }
      }
    } catch {
      // Gracefully ignore malformed customNotes
    }
  }

  // Collect all searchable tokens
  const tokenEntries: Array<{ searchStr: string; key: string; def: MetricDefinition }> = [];
  for (const [key, def] of glossaryMap.entries()) {
    tokenEntries.push({ searchStr: def.token, key, def });
    if (def.alternativeTokens) {
      for (const alt of def.alternativeTokens) {
        tokenEntries.push({ searchStr: alt, key, def });
      }
    }
  }

  // Sort by token length descending to match longer strings first
  tokenEntries.sort((a, b) => b.searchStr.length - a.searchStr.length);

  // Find all matches with boundary check
  const candidates: MatchCandidate[] = [];

  for (const { searchStr, key, def } of tokenEntries) {
    const escaped = escapeRegex(searchStr);
    // Boundary check: preceded by start of string or whitespace/delimiter, followed by end or whitespace/delimiter
    const pattern = new RegExp(`(?:^|[\\s,;:\\[\\]|()])(${escaped})(?=$|[\\s,;:\\[\\]|()])`, 'g');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(outputSample)) !== null) {
      const matchedText = match[1];
      const matchIndex = match.index + (match[0].length - matchedText.length);
      const endIndex = matchIndex + matchedText.length;

      candidates.push({
        start: matchIndex,
        end: endIndex,
        text: matchedText,
        metricKey: key,
        metric: def
      });
    }
  }

  // Filter overlapping candidates (keep first / longest by sorting candidates by start, then length desc)
  candidates.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  const selectedMatches: MatchCandidate[] = [];
  let lastEnd = 0;

  for (const cand of candidates) {
    if (cand.start >= lastEnd) {
      selectedMatches.push(cand);
      lastEnd = cand.end;
    }
  }

  // Build segments and activeMetrics
  const segments: OutputSegment[] = [];
  const activeMetrics: Record<string, MetricDefinition> = {};
  let currentIdx = 0;

  for (const m of selectedMatches) {
    if (m.start > currentIdx) {
      segments.push({
        text: outputSample.slice(currentIdx, m.start)
      });
    }

    const isAlert = m.metric.severity === 'warning' || m.metric.severity === 'critical';
    segments.push({
      text: m.text,
      metricKey: m.metricKey,
      isAlert
    });

    activeMetrics[m.metricKey] = m.metric;
    currentIdx = m.end;
  }

  if (currentIdx < outputSample.length) {
    segments.push({
      text: outputSample.slice(currentIdx)
    });
  }

  return { segments, activeMetrics };
}
