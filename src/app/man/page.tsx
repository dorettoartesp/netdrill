'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getAllManPages, ManPage } from '@/lib/man-engine';
import { Search, ArrowLeft, BookOpen, ExternalLink, Sparkles } from 'lucide-react';

interface CatalogPageItem extends ManPage {
  source?: 'bundled' | 'ai_nemotron';
}

export default function ManCataloguePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [pages, setPages] = useState<CatalogPageItem[]>(() =>
    getAllManPages().map((p) => ({ ...p, source: 'bundled' }))
  );

  // Fetch newly generated pages from DB
  useEffect(() => {
    fetch('/api/man')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPages(data);
        }
      })
      .catch((err) => console.warn('[Catalogue] Failed to fetch updated pages:', err));
  }, []);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return pages;
    const q = searchQuery.trim().toLowerCase();
    return pages.filter(
      (p) =>
        p.command.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.synopsis.toLowerCase().includes(q) ||
        p.options.some((opt) => opt.toLowerCase().includes(q))
    );
  }, [pages, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchQuery.trim().toLowerCase().split(/\s+/)[0];
    if (clean) {
      router.push(`/man/${encodeURIComponent(clean)}`);
    }
  };

  const man7SearchUrl = searchQuery.trim()
    ? `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim() + ' site:man7.org/linux/man-pages')}`
    : 'https://man7.org/linux/man-pages/index.html';

  return (
    <div className="min-h-screen bg-[#0a0d14] text-gray-200 font-mono p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Navigation */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1 border border-gray-800 hover:border-gray-700 px-2.5 py-1.5 rounded transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Treino</span>
            </Link>
            <div className="h-4 w-px bg-gray-800" />
            <h1 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Linux Manual (man)</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://man7.org/linux/man-pages/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-cyan-300 flex items-center gap-1 border border-gray-800 hover:border-cyan-700 px-2.5 py-1.5 rounded transition"
            >
              <span>Índice man7.org</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-xs text-gray-500 hidden sm:inline">
              {filteredPages.length} manuais catalogados
            </span>
          </div>
        </header>

        {/* Search Bar with JIT Generator */}
        <form onSubmit={handleSearchSubmit} className="bg-[#10141f] border border-cyan-800/40 rounded-lg p-3 shadow-lg">
          <label htmlFor="man-search" className="block text-xs text-cyan-400/80 mb-1.5 font-bold">
            BUSCAR NO CATÁLOGO OU DIGITAR QUALQUER COMANDO:
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-cyan-400 font-bold">$ man</span>
            <input
              id="man-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="digite qualquer comando (ex: rsync, strace, jq, tcpdump, ps)..."
              className="w-full bg-[#0a0d14] border border-gray-800 rounded pl-20 pr-24 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition"
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-3 py-1.5 rounded text-xs transition cursor-pointer flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Abrir</span>
            </button>
          </div>
        </form>

        {/* Manual Grid */}
        {filteredPages.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg p-6 space-y-4">
            <p className="text-white font-bold text-sm">
              O comando &quot;{searchQuery}&quot; ainda não está catalogado localmente.
            </p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Você pode solicitar a síntese do manual estruturado em português via inteligência artificial ou consultar o repositório canônico upstream no man7.org:
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/man/${encodeURIComponent(searchQuery.trim().toLowerCase().split(/\s+/)[0])}`}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded text-xs transition flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gerar Manual para &quot;{searchQuery}&quot; via Nemotron AI</span>
              </Link>
              <a
                href={man7SearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#12151e] border border-cyan-800/80 hover:border-cyan-600 text-cyan-300 px-4 py-2 rounded text-xs transition flex items-center gap-1.5"
              >
                <span>Buscar no man7.org via Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPages.map((page: CatalogPageItem) => (
              <div
                key={page.command}
                className="bg-[#10141f] border border-gray-800 hover:border-cyan-700/60 rounded-lg p-4 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-cyan-300">
                      {page.command} <span className="text-xs text-gray-500 font-normal">({page.sectionName})</span>
                    </span>
                    {page.source === 'ai_nemotron' ? (
                      <span className="text-[10px] bg-purple-950/80 border border-purple-700 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>IA Nemotron</span>
                      </span>
                    ) : (
                      <span className="text-[10px] bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 px-2 py-0.5 rounded font-semibold">
                        Nativo NetDrill
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-300 mb-3 line-clamp-2 leading-relaxed">
                    {page.description}
                  </p>

                  <div className="bg-[#0a0d14] border border-gray-850 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-mono mb-3 overflow-x-auto whitespace-pre">
                    $ {page.synopsis}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-850 flex items-center justify-between text-xs">
                  <span className="text-gray-500 text-[11px]">
                    {page.options.length} flags catalogadas
                  </span>
                  <Link
                    href={`/man/${page.command}`}
                    className="text-cyan-400 hover:text-cyan-200 flex items-center gap-1 font-bold transition hover:underline"
                  >
                    <span>Abrir Manual</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
