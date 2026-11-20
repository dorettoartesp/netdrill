'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { DocumentSummary } from '@/lib/content/catalog';

/**
 * Manual catalog: searchable list of uploaded commands and procedures.
 */
export default function ManCataloguePage() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/man?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        setItems(await res.json());
        setError(false);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(true);
      }
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const commands = items?.filter((d) => d.kind === 'command') ?? [];
  const procedures = items?.filter((d) => d.kind === 'procedure') ?? [];

  const renderList = (title: string, list: DocumentSummary[], mono: boolean) =>
    list.length > 0 && (
      <section className="space-y-2">
        <h2 className="m-0 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {list.map((d) => (
            <Link
              key={d.id}
              href={`/man/${d.id}`}
              className="flex flex-col gap-1 rounded-xl border border-[#262b3d] bg-[#12141c] px-3.5 py-3 hover:border-green-800"
            >
              <span className="flex justify-between gap-2">
                <span className={`${mono ? 'font-mono font-bold' : 'font-semibold'} text-slate-100`}>{d.name}</span>
                <span className="shrink-0 text-xs text-slate-400">{d.topicSlug}</span>
              </span>
              <span className="text-[13px] text-slate-400 line-clamp-2">{d.summary}</span>
            </Link>
          ))}
        </div>
      </section>
    );

  return (
    <main className="min-h-screen bg-[#0c0e14] text-[#e2e8f0] font-sans">
      <header className="h-14 flex items-center gap-1 border-b border-[#1d2230] px-1 lg:px-4">
        <Link href="/" aria-label="Back to sessions" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white">
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </Link>
        <h1 className="m-0 text-[17px] font-semibold">Manual</h1>
      </header>
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-4">
        <label htmlFor="man-search" className="sr-only">Search commands and procedures</label>
        <div className="flex min-h-[48px] items-center gap-2.5 rounded-xl border-[1.5px] border-[#262b3d] bg-[#05070a] px-3.5 focus-within:border-green-700">
          <span className="font-mono font-bold text-sky-400" aria-hidden="true">$ man</span>
          <input
            id="man-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="min-w-0 flex-1 border-0 bg-transparent font-mono text-slate-100 outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-300">The manual could not be loaded. Please try again.</p>}
        {items && items.length === 0 && !error && (
          <p className="py-8 text-center text-sm text-slate-400">
            {query ? 'No entries match your search.' : 'No manual entries yet. Upload content in '}
            {!query && <Link href="/import" className="text-green-400 hover:text-green-300">Import</Link>}
            {!query && '.'}
          </p>
        )}
        {renderList('Commands', commands, true)}
        {renderList('Procedures', procedures, false)}
      </div>
    </main>
  );
}
