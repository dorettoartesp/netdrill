import { NextRequest, NextResponse } from 'next/server';
import { getManPage } from '@/lib/man-engine';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';
import { getCachedManPage, upsertCachedManPage } from '@/lib/man-db';
import { generateManPageWithNemotron } from '@/lib/nemotron-generator';

export const dynamic = 'force-dynamic';

const COMMAND_NAME_REGEX = /^[a-z0-9][a-z0-9._+-]{0,63}$/i;

/**
 * Serves structured Linux manual pages as JSON, with instant static lookup,
 * Turso libSQL caching, on-demand OpenRouter Nemotron synthesis, and man7.org fallback.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { cmd: string } }
) {
  const rawCmd = params?.cmd;
  if (!rawCmd || typeof rawCmd !== 'string') {
    return NextResponse.json({ error: 'Comando inválido' }, { status: 400 });
  }

  const cleanCmd = rawCmd.trim().toLowerCase().split(/\s+/)[0];
  const man7Url = `https://www.google.com/search?q=${encodeURIComponent((cleanCmd || 'linux') + ' site:man7.org/linux/man-pages')}`;

  if (!cleanCmd || !COMMAND_NAME_REGEX.test(cleanCmd)) {
    return NextResponse.json(
      { error: 'Nome de comando inválido. Use caracteres alfanuméricos simples.', man7Url },
      { status: 400 }
    );
  }

  const isRefresh = request.nextUrl?.searchParams?.get('refresh') === 'true';

  // 1. Check bundled static pages first (immutable reference manuals)
  const staticPage = getManPage(cleanCmd);
  if (staticPage) {
    return NextResponse.json(
      { ...staticPage, source: 'bundled', man7Url },
      { status: 200 }
    );
  }

  const db = getDbClient();

  // Ensure DB migrations exist
  try {
    await runMigrations(db);
  } catch (err) {
    console.warn('[ManAPI] DB migration check warning:', err);
  }

  // 2. Check Turso DB cache (if not explicit refresh)
  if (!isRefresh) {
    try {
      const cached = await getCachedManPage(db, cleanCmd);
      if (cached) {
        return NextResponse.json(
          { ...cached, source: cached.source || 'ai_nemotron', man7Url },
          { status: 200 }
        );
      }
    } catch (err) {
      console.warn(`[ManAPI] Database lookup error for ${cleanCmd}:`, err);
    }
  }

  // 3. JIT Generation via Nemotron
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: `Manual para '${cleanCmd}' não encontrado. Serviço de geração por IA temporariamente indisponível.`,
        man7Url
      },
      { status: 503 }
    );
  }

  try {
    const result = await generateManPageWithNemotron(cleanCmd, apiKey);

    if ('notFound' in result) {
      return NextResponse.json(
        {
          error: `O utilitário '${cleanCmd}' não foi reconhecido como um comando Linux/POSIX válido.`,
          man7Url
        },
        { status: 404 }
      );
    }

    // Persist in Turso DB
    try {
      await upsertCachedManPage(db, result, 'ai_nemotron');
    } catch (err) {
      console.warn(`[ManAPI] Failed to persist generated manpage for ${cleanCmd}:`, err);
    }

    return NextResponse.json(
      { ...result, source: 'ai_nemotron', man7Url },
      { status: 200 }
    );
  } catch (err) {
    console.error(`[ManAPI] Nemotron generation failed for ${cleanCmd}:`, err);
    return NextResponse.json(
      {
        error: `Não foi possível gerar o manual para '${cleanCmd}' no momento. Tente novamente em instantes.`,
        man7Url
      },
      { status: 503 }
    );
  }
}
