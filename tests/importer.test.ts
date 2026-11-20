import { describe, it, expect } from 'vitest';
import { getDbClient } from '../src/lib/db';
import { runMigrations } from '../src/lib/migrate';
import { importBulkData, BulkImportPayload } from '../src/lib/importer';

describe('Bulk Importer', () => {
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
