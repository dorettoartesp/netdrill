import { describe, it, expect, beforeEach } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { getCachedManPage, upsertCachedManPage, listCachedManPages } from '../src/lib/man-db';

describe('Man Pages Database Cache', () => {
  let db: ReturnType<typeof getDbClient>;

  beforeEach(async () => {
    db = getDbClient(':memory:');
    await runMigrations(db);
  });

  it('should return null when a command is not cached', async () => {
    const page = await getCachedManPage(db, 'rsync');
    expect(page).toBeNull();
  });

  it('should upsert and retrieve an AI-generated manpage', async () => {
    const mockPage = {
      command: 'rsync',
      title: 'rsync - ferramenta rápida de cópia e sincronização remota de arquivos',
      sectionName: '1 (Comandos de Usuário)',
      synopsis: 'rsync [opções] origem destino',
      description: 'O rsync sincroniza arquivos localmente ou através da rede.',
      options: ['-a : Modo arquivo preservando permissões e timestamps', '-v : Modo verboso'],
      examples: ['rsync -avz /dados/ user@servidor:/backup/'],
      source: 'ai_nemotron' as const
    };

    await upsertCachedManPage(db, mockPage, 'ai_nemotron');

    const cached = await getCachedManPage(db, 'rsync');
    expect(cached).not.toBeNull();
    expect(cached?.command).toBe('rsync');
    expect(cached?.options.length).toBe(2);
    expect(cached?.examples.length).toBe(1);
    expect(cached?.source).toBe('ai_nemotron');
  });

  it('should list all cached manual pages ordered by command', async () => {
    await upsertCachedManPage(db, {
      command: 'strace',
      title: 'strace - rastreador de chamadas de sistema',
      sectionName: '1 (Comandos de Usuário)',
      synopsis: 'strace [opções] comando',
      description: 'Interrompe e rastreia syscalls executadas por um processo.',
      options: ['-p pid : Anexa a um processo em execução'],
      examples: ['strace -p 1234']
    });

    const pages = await listCachedManPages(db);
    expect(pages.some((p) => p.command === 'strace')).toBe(true);
  });
});
