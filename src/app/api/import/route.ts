import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';
import { importBulkData, BulkImportPayload } from '@/lib/importer';

export async function POST(req: NextRequest) {
  try {
    const payload: BulkImportPayload = await req.json();
    const db = getDbClient();

    // Ensure database tables exist
    await runMigrations(db);

    const result = await importBulkData(db, payload);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: `Importação realizada com sucesso: ${result.importedCount} itens cadastrados.`,
      importedCount: result.importedCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Falha ao processar importação' },
      { status: 500 }
    );
  }
}
