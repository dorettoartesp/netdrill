import { PACK_FORMAT, packJsonSchema } from './schema';

/** Placeholder the author replaces with what they want generated. */
export const PROMPT_TOPIC_PLACEHOLDER = '[DESCRIBE THE TOPIC AND THE COMMANDS/PROCEDURES YOU WANT]';

/** Compact, valid example pack embedded in the prompt (kept valid by a test). */
const EXAMPLE_PACK = {
  format: PACK_FORMAT,
  topic: { slug: 'linux', title: 'Linux Administration', description: 'Troubleshooting processes, sockets and services' },
  commands: [
    {
      id: 'linux.ss',
      name: 'ss',
      summary: 'Socket inspection via Netlink, the modern netstat replacement',
      synopsis: 'ss [options] [filter]',
      description: 'Reads socket state directly from the kernel; much faster than netstat on busy hosts.',
      flags: [
        { flag: '-t', long: '--tcp', description: 'TCP sockets only.', example: 'ss -t' },
        { flag: '-l', long: '--listening', description: 'Listening sockets only.', example: 'ss -tl' },
        { flag: '-p', long: '--processes', description: 'Show the owning PID and process (requires root).', example: 'sudo ss -tlp' },
        { flag: '-n', long: '--numeric', description: 'Do not resolve host or service names.', example: 'ss -tn' },
      ],
      examples: [
        {
          id: 'listening-sockets',
          title: 'Listening ports with process',
          scenario: 'The service on port 8080 does not answer. List listening TCP and UDP sockets with their process, numerically.',
          command: 'ss -tulpn',
          explanation: '-t TCP, -u UDP, -l listening only, -p process, -n numeric output.',
          output: 'Netid State  Recv-Q Send-Q Local Address:Port Process\ntcp   LISTEN 0      511    0.0.0.0:80         users:(("nginx",pid=1420,fd=6))',
          output_notes: [
            { token: 'Recv-Q', meaning: 'For LISTEN sockets, completed connections waiting for accept().', normal: '0 or low and transient.', anomaly: 'Close to Send-Q: the application is not accepting connections fast enough.', severity: 'warning' },
          ],
        },
        {
          id: 'established-count',
          title: 'Socket summary',
          scenario: 'Get a quick summary of socket counts by state.',
          command: 'ss -s',
          output: 'Total: 412\nTCP:   389 (estab 120, closed 251, orphaned 0, timewait 249)',
          output_notes: [
            { token: 'timewait', meaning: 'Closed connections waiting out 2*MSL.', normal: 'Proportional to connection churn.', anomaly: 'Tens of thousands: missing keep-alive or connection pooling.', severity: 'warning' },
          ],
        },
      ],
      use_cases: [
        { title: 'Port down after a deploy', situation: 'Confirm whether the new process is listening on the expected address and port.', severity: 'incident' },
        { title: 'Unexpected listener', situation: 'An audit finds an unknown open port; ss -tulpn names the process behind it.', severity: 'critical' },
        { title: 'Connection churn', situation: 'ss -s shows thousands of TIME-WAIT sockets after a client stopped reusing connections.', severity: 'routine' },
      ],
      pitfalls: ['Without -n, DNS resolution can stall the output.'],
      related: ['linux.lsof'],
      tags: ['network', 'sockets'],
    },
  ],
  procedures: [
    {
      id: 'linux.cgroup-oom-triage',
      title: 'Triage intermittent OOM in a service cgroup',
      context: 'The API is OOM-killed intermittently under load.',
      goal: 'Compare cgroup memory usage, limit and OOM events.',
      steps: [
        { command: 'cat /sys/fs/cgroup/api.service/memory.current', purpose: 'Current usage', output: '1879048192', interpretation: 'Compare with the limit.' },
        { command: 'cat /sys/fs/cgroup/api.service/memory.max', purpose: 'Configured limit', output: '2147483648', interpretation: 'Usage at 87% of the 2 GiB limit leaves little headroom.' },
        { command: 'grep oom /sys/fs/cgroup/api.service/memory.events', purpose: 'OOM events', output: 'oom 3\noom_kill 3', interpretation: 'Non-zero oom_kill confirms kills by the cgroup limit.' },
      ],
      uses: ['linux.cat', 'linux.grep'],
      use_cases: [{ title: 'Nightly batch OOM', situation: 'Batch jobs share the service cgroup and exhaust its limit.', severity: 'critical' }],
      tags: ['memory', 'cgroups'],
    },
  ],
};

/**
 * Builds the copyable prompt that makes any LLM produce a valid `netdrill.pack/v1` file.
 *
 * @returns The full prompt text: role, placeholder, authoring rules, JSON Schema and an example.
 */
export function buildAuthoringPrompt(): string {
  return `You write NetDrill content packs: JSON files that teach infrastructure commands through drills and a manual.

What I want:
${PROMPT_TOPIC_PLACEHOLDER}

Produce one pack (format "${PACK_FORMAT}") for a single topic, following these rules:
1. Write all prose in English, in a precise technical register. Commands, flags and outputs are verbatim.
2. A command document describes one command: synopsis, description, flags (only real flags; Do not invent flags or options), examples, use cases, pitfalls and related commands.
3. Each example is a drill the learner types from memory: one idea per drill, each line under 80 characters. Split long commands into short, progressive examples, and keep the full long form as a reference example with "drill": false.
4. Use short realistic placeholders (localhost:8000, api.service, /var/log/app.log) instead of long IPs or paths.
5. A procedure is a multi-step real task (investigation, reproduction, configuration block). Each step has the exact command, its purpose, a realistic output when useful and how to interpret it. List the command ids it uses in "uses".
6. Every example and every procedure step that prints something must include a realistic "output" and annotate its meaningful tokens in "output_notes" (meaning, normal baseline, anomaly, severity). If the command prints nothing on success, set "no_output": true instead.
6b. Every procedure step needs an "interpretation": what the learner should conclude from that step.
7. Use stable ids: "<topic.slug>.<name>" for commands and procedures (lowercase, digits, dots, hyphens) and short kebab-case ids for examples. Keep the same ids when you revise a pack so re-uploads update instead of duplicating.
8. Give every command at least 3 use cases and every procedure at least 1: concrete production situations (what broke or what was needed, and how this command helps), with severity "routine", "incident" or "critical".
9. Output only the JSON, with no commentary and no code fences.

JSON Schema:
${JSON.stringify(packJsonSchema(), null, 2)}

Example of a valid pack:
<example>
${JSON.stringify(EXAMPLE_PACK, null, 2)}
</example>
`;
}
