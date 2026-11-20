import { describe, it, expect } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { importBulkData, BulkImportPayload } from '../src/lib/importer';

// Skipped: legacy schema; replaced in Tasks 5–7 of the command-centric content plan.
describe.skip('Bulk Importer', () => {
  it('should import new topic, module and items in a single transaction', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);

    const payload: BulkImportPayload = {
      topic: 'fortigate',
      topic_title: 'Firewall FortiGate',
      module: 'firewall-policies',
      module_title: 'Políticas de Firewall',
      items: [
        {
          type: 'block',
          title: 'Liberar LAN para WAN com NAT',
          prompt: 'Configurar firewall policy liberando port2 para port1 com NAT',
          target: 'config firewall policy\nedit 1\nset action accept\nnext\nend',
          output_sample: 'FW-01 # get\n== [ 1 ]\nid: 1   action: accept',
          explanation: 'Habilita política de saída com NAT.',
          tags: 'fortigate,firewall,nat',
        },
        {
          type: 'command',
          title: 'Top processos',
          prompt: 'Monitorar processos no FortiOS a cada 2s',
          target: 'diagnose sys top 2 10',
          explanation: 'Exibe consumo de CPU e RAM.',
          tags: 'fortigate,diag',
        },
      ],
    };

    const result = await importBulkData(db, payload);
    if (!result.success) console.error('IMPORT ERROR:', result.error);
    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(2);

    const topics = await db.execute("SELECT * FROM topics WHERE slug = 'fortigate';");
    expect(topics.rows.length).toBe(1);

    const modules = await db.execute("SELECT * FROM modules WHERE slug = 'firewall-policies';");
    expect(modules.rows.length).toBe(1);

    const items = await db.execute('SELECT * FROM items;');
    expect(items.rows.length).toBe(2);
    expect(items.rows[0].output_sample).toBe('FW-01 # get\n== [ 1 ]\nid: 1   action: accept');

    const progress = await db.execute('SELECT * FROM user_progress;');
    expect(progress.rows.length).toBe(2);
  });

  it('should ingest and serialize use_cases and output_notes in bulk deck import', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);

    const payload: BulkImportPayload = {
      topic: 'test-topic',
      topic_title: 'Test Topic',
      module: 'test-module',
      module_title: 'Test Module',
      items: [
        {
          type: 'command',
          title: 'Ver processos com detalhes',
          prompt: 'Investigue consumo anormal de CPU',
          target: 'ps aux',
          output_sample: 'USER PID %CPU STAT COMMAND\nroot 1 0.0 S /sbin/init',
          explanation: 'Exibe processos',
          use_cases: [
            { title: 'Lentidão em Servidor', description: 'Worker em loop', severity: 'warning' }
          ],
          output_notes: [
            { token: 'STAT', label: 'Estado', severity: 'info', description: 'Estado do processo', normalBaseline: 'S', anomalyAlert: 'D constante' }
          ]
        } as any
      ]
    };

    const result = await importBulkData(db, payload);
    if (!result.success) console.error('IMPORT ERROR:', result.error);
    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(1);

    const row = await db.execute({ sql: 'SELECT use_cases, output_notes FROM items LIMIT 1;', args: [] });
    expect(row.rows[0].use_cases).toContain('Lentidão em Servidor');
    expect(row.rows[0].output_notes).toContain('Estado do processo');
  });

  it('should reject invalid payload without items', async () => {
    const db = getDbClient(':memory:');
    await runMigrations(db);

    const invalidPayload: any = {
      topic: 'linux',
      items: [],
    };

    const result = await importBulkData(db, invalidPayload);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
