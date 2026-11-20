import { NextResponse } from 'next/server';
import { getAllManPages } from '@/lib/man-engine';
import { getDbClient } from '@/lib/db';
import { listCachedManPages, CachedManPage } from '@/lib/man-db';

/**
 * Returns all catalogued manual pages, combining bundled static manuals
 * and all on-demand manuals generated and cached in the database.
 */
export async function GET() {
  const bundled = getAllManPages().map((p) => ({
    ...p,
    source: 'bundled' as const
  }));

  let cached: CachedManPage[] = [];
  try {
    const db = getDbClient();
    cached = await listCachedManPages(db);
  } catch (err) {
    console.warn('[ManCatalogAPI] DB lookup error:', err);
  }

  const map = new Map<string, any>();
  for (const b of bundled) {
    map.set(b.command.toLowerCase(), b);
  }
  for (const c of cached) {
    if (!map.has(c.command.toLowerCase())) {
      map.set(c.command.toLowerCase(), c);
    }
  }

  return NextResponse.json(Array.from(map.values()), { status: 200 });
}
