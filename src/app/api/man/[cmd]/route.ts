import { NextRequest, NextResponse } from 'next/server';
import { getManPage } from '@/lib/man-engine';
import { getDbClient } from '@/lib/db';
import { getCachedManPage, upsertCachedManPage } from '@/lib/man-db';
import { generateManPageWithNemotron } from '@/lib/nemotron-generator';

/**
 * Serves structured Linux manual pages as JSON, with instant static lookup,
 * Turso libSQL caching, on-demand OpenRouter Nemotron synthesis, and man7.org fallback.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { cmd: string } }
) {
  const { cmd } = params;
  if (!cmd || typeof cmd !== 'string') {
    return NextResponse.json({ error: 'Comando inválido' }, { status: 400 });
  }

  const cleanCmd = cmd.trim().toLowerCase().split(/\s+/)[0];
  const isRefresh = request.nextUrl?.searchParams?.get('refresh') === 'true';
  const man7Url = `https://www.google.com/search?q=${encodeURIComponent(cleanCmd + ' site:man7.org/linux/man-pages')}`;

  // 1. Check bundled static pages first (immutable reference manuals)
  const staticPage = getManPage(cleanCmd);
  if (staticPage) {
    return NextResponse.json(
      { ...staticPage, source: 'bundled', man7Url },
      { status: 200 }
    );
  }

  const db = getDbClient();

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
        error: `Manual para '${cleanCmd}' não encontrado e OPENROUTER_API_KEY não configurada.`,
        man7Url
      },
      { status: 503 }
    );
  }

  try {
    const result = await generateManPageWithNemotron(cleanCmd, apiKey);

    if ('notFound' in result && result.notFound) {
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
    const msg = err instanceof Error ? err.message : 'Falha na geração via IA';
    return NextResponse.json(
      {
        error: `Não foi possível gerar o manual para '${cleanCmd}': ${msg}`,
        man7Url
      },
      { status: 503 }
    );
  }
}
