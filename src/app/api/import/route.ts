import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';
import { importBulkData, BulkImportPayload } from '@/lib/importer';

/**
 * Handles HTTP POST requests for bulk module and item ingestion.
 *
 * @param req - Incoming NextRequest containing the JSON BulkImportPayload.
 * @returns NextResponse containing status confirmation or validation error messages.
 */
export async function POST(req: NextRequest) {
  try {
    const rawPayload = await req.json();
    const db = getDbClient();

    // Ensure database tables exist
    await runMigrations(db);

    const payloads: BulkImportPayload[] = Array.isArray(rawPayload)
      ? rawPayload
      : [rawPayload];

    let totalImported = 0;
    for (const payload of payloads) {
      const result = await importBulkData(db, payload);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      totalImported += result.importedCount || 0;
    }

    return NextResponse.json({
      message: `Importação realizada com sucesso: ${totalImported} itens cadastrados.`,
      importedCount: totalImported,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Falha ao processar importação' },
      { status: 500 }
    );
  }
}
