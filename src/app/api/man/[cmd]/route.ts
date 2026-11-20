import { NextRequest, NextResponse } from 'next/server';
import { getManPage } from '@/lib/man-engine';

/**
 * Serves structured Linux manual pages as JSON.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { cmd: string } }
) {
  const { cmd } = params;
  const page = getManPage(cmd);

  if (!page) {
    return NextResponse.json(
      { error: `Manual para o comando '${cmd}' não encontrado.` },
      { status: 404 }
    );
  }

  return NextResponse.json(page, { status: 200 });
}
