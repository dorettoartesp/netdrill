'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { getAllManPages, ManPage } from '@/lib/man-engine';
import { Search, Terminal, ArrowLeft, BookOpen, ExternalLink } from 'lucide-react';

export default function ManCataloguePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const allPages = useMemo(() => getAllManPages(), []);

  const filteredPages = useMemo(() => {
    if (!searchQuery.trim()) return allPages;
    const q = searchQuery.trim().toLowerCase();
    return allPages.filter(
      (p) =>
        p.command.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.synopsis.toLowerCase().includes(q) ||
        p.options.some((opt) => opt.toLowerCase().includes(q))
    );
  }, [allPages, searchQuery]);

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
          <span className="text-xs text-gray-500">
            {filteredPages.length} de {allPages.length} manuais embutidos
          </span>
        </header>

        {/* Search Bar */}
        <div className="bg-[#10141f] border border-cyan-800/40 rounded-lg p-3 shadow-lg">
          <label htmlFor="man-search" className="block text-xs text-cyan-400/80 mb-1.5 font-bold">
            BUSCAR NO CATÁLOGO DO MANUAL:
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-cyan-400 font-bold">$ man</span>
            <input
              id="man-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="digite o comando ou palavra-chave (ex: socket, process, ip)..."
              className="w-full bg-[#0a0d14] border border-gray-800 rounded pl-20 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition"
              autoFocus
            />
            <Search className="w-4 h-4 text-gray-500 absolute right-3 pointer-events-none" />
          </div>
        </div>

        {/* Manual Grid */}
        {filteredPages.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-lg">
            <p className="text-gray-400 mb-2">Nenhum manual encontrado para &quot;{searchQuery}&quot;.</p>
            <p className="text-xs text-gray-600">Tente buscar por termos genéricos como &quot;tcp&quot;, &quot;processo&quot; ou &quot;log&quot;.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPages.map((page: ManPage) => (
              <div
                key={page.command}
                className="bg-[#10141f] border border-gray-800 hover:border-cyan-700/60 rounded-lg p-4 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-cyan-300">
                      {page.command} <span className="text-xs text-gray-500 font-normal">({page.sectionName})</span>
                    </span>
                    <span className="text-[10px] bg-cyan-950/70 border border-cyan-800/80 text-cyan-300 px-2 py-0.5 rounded">
                      SEÇÃO {page.sectionName.split(' ')[0]}
                    </span>
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
