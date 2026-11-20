/** Builds a valid `linux` pack: command `linux.ss` (2 drillable examples) and procedure `linux.oom`. */
export function linuxPack(): any {
  return {
    format: 'netdrill.pack/v1',
    topic: { slug: 'linux', title: 'Linux Administration', description: 'Processes and sockets' },
    commands: [
      {
        id: 'linux.ss',
        name: 'ss',
        summary: 'Socket inspection',
        synopsis: 'ss [options] [filter]',
        description: 'Modern netstat replacement.',
        flags: [{ flag: '-t', long: '--tcp', description: 'TCP sockets only.' }],
        examples: [
          { id: 'listening', title: 'Listening sockets', scenario: 'List listening sockets with process.', command: 'ss -tulpn' },
          { id: 'summary', title: 'Summary', scenario: 'Show socket summary.', command: 'ss -s' },
        ],
        use_cases: [{ title: 'Port down after deploy', situation: 'The service port does not answer.', severity: 'incident' }],
      },
    ],
    procedures: [
      {
        id: 'linux.oom',
        title: 'OOM triage',
        context: 'The API is OOM-killed under load.',
        steps: [
          { command: 'cat memory.current', purpose: 'Usage' },
          { command: 'grep oom memory.events', purpose: 'Events' },
        ],
        uses: ['linux.ss', 'linux.grep'],
      },
    ],
  };
}
