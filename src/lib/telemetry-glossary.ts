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
    label: '%CPU (processor utilization)',
    severity: 'warning',
    description: 'Share of processor time consumed by the process.',
    normalBaseline: '< 70% under typical load',
    anomalyAlert: 'Sustained > 90% or pinned at 100% (busy loop in a thread or process)'
  },
  '%mem': {
    token: '%MEM',
    key: '%mem',
    label: '%MEM (physical memory share)',
    severity: 'warning',
    description: 'Share of physical RAM used by the process.',
    normalBaseline: '< 60% per process',
    anomalyAlert: 'Continuous growth without release (memory leak)'
  },
  rss: {
    token: 'RSS',
    key: 'rss',
    label: 'RSS (Resident Set Size)',
    severity: 'info',
    description: 'Physical memory currently resident for the process, in kilobytes.',
    normalBaseline: 'Stable after the application warms up',
    anomalyAlert: 'Steady linear growth preceding the OOM killer'
  },
  'time+': {
    token: 'TIME+',
    key: 'time+',
    label: 'TIME+ (accumulated CPU time)',
    severity: 'info',
    description: 'Total CPU time the process has used since it started.',
    normalBaseline: 'Grows in proportion to uptime',
    anomalyAlert: 'Steep growth over a short interval (processing loop)'
  },
  stat_d: {
    token: 'D',
    key: 'stat_d',
    label: 'STAT D (Uninterruptible Sleep / D-State)',
    severity: 'critical',
    description: 'Process blocked waiting for disk I/O or a synchronous NFS call. It does not respond to SIGKILL.',
    normalBaseline: 'Absent, or transitions lasting milliseconds',
    anomalyAlert: 'Persistent D: storage unavailable, failing disk or hung NFS mount'
  },
  stat_z: {
    token: 'Z',
    key: 'stat_z',
    label: 'STAT Z (Zombie Process)',
    severity: 'critical',
    description: 'Process that exited but whose process table entry was not yet reaped by its parent.',
    normalBaseline: '0 zombies',
    anomalyAlert: 'Zombies accumulating until the kernel PID table is exhausted'
  },
  stat_r: {
    token: 'R',
    key: 'stat_r',
    label: 'STAT R (Running / Runnable)',
    severity: 'info',
    description: 'Process running on a CPU or waiting in the run queue.',
    normalBaseline: 'At most the number of available vCPUs',
    anomalyAlert: 'Far above the core count: CPU saturation and high load average'
  },
  stat_s: {
    token: 'S',
    key: 'stat_s',
    label: 'STAT S (Interruptible Sleep)',
    severity: 'info',
    description: 'Process sleeping until an event occurs (timer, network packet, input).',
    normalBaseline: 'Default state of most idle daemons and workers',
    anomalyAlert: 'None'
  },
  'wa%': {
    token: 'wa%',
    key: 'wa%',
    alternativeTokens: ['wa'],
    label: 'wa% (CPU I/O wait)',
    severity: 'critical',
    description: 'Share of time the CPU sat idle waiting for disk or network I/O.',
    normalBaseline: '< 5%',
    anomalyAlert: '> 20%: severe disk I/O bottleneck, saturated SAN or stalled write queue'
  },
  'recv-q': {
    token: 'Recv-Q',
    key: 'recv-q',
    label: 'Recv-Q (socket receive queue)',
    severity: 'warning',
    description: 'Bytes received by the kernel but not yet read by the application (for LISTEN sockets: connections waiting for accept()).',
    normalBaseline: '0',
    anomalyAlert: 'Constantly > 0: application blocked, exhausted thread pool or starvation'
  },
  'send-q': {
    token: 'Send-Q',
    key: 'send-q',
    label: 'Send-Q (socket send queue)',
    severity: 'warning',
    description: 'Bytes sent by the application but not yet acknowledged by the peer (for LISTEN sockets: the backlog size).',
    normalBaseline: '0',
    anomalyAlert: 'Constantly > 0: saturated link or congested receiver'
  },
  listen: {
    token: 'LISTEN',
    key: 'listen',
    label: 'LISTEN (open TCP port)',
    severity: 'info',
    description: 'Socket actively waiting for client TCP connections.',
    normalBaseline: 'Only known, approved services',
    anomalyAlert: 'Unknown port on 0.0.0.0 / :::* (possible backdoor or unwanted service)'
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
  glossaryMap.forEach((def, key) => {
    tokenEntries.push({ searchStr: def.token, key, def });
    if (def.alternativeTokens) {
      for (const alt of def.alternativeTokens) {
        tokenEntries.push({ searchStr: alt, key, def });
      }
    }
  });

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
