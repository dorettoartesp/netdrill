'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Terminal, RefreshCw, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { ManPage } from '@/lib/man-engine';

interface LoadedManPage extends ManPage {
  source?: 'bundled' | 'ai_nemotron';
  man7Url?: string;
}

export default function ManCmdPage() {
  const params = useParams();
  const rawCmd = typeof params?.cmd === 'string' ? params.cmd : Array.isArray(params?.cmd) ? params.cmd[0] : '';
  const cleanCmd = rawCmd.trim().toLowerCase();

  const [page, setPage] = useState<LoadedManPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPage = useCallback(async (cmd: string, forceRefresh = false) => {
    if (!cmd) return;
    setIsLoading(true);
    setElapsedSeconds(0);
    setErrorMsg(null);

    try {
      const url = `/api/man/${encodeURIComponent(cmd)}${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Manual não encontrado para este comando.');
        setPage(null);
      } else {
        setPage(data);
        setErrorMsg(null);
      }
    } catch (err) {
      console.error('[ManReader] Fetch error:', err);
      setErrorMsg('Falha ao comunicar com o servidor de manuais.');
      setPage(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cleanCmd) {
      fetchPage(cleanCmd);
    }
  }, [cleanCmd, fetchPage]);

  // Elapsed timer during AI generation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const man7SearchUrl = `https://www.google.com/search?q=${encodeURIComponent(cleanCmd + ' site:man7.org/linux/man-pages')}`;

  return (
    <div className="min-h-screen bg-[#0a0d14] text-gray-200 font-mono p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/man"
              className="text-xs text-gray-400 hover:text-cyan-400 flex items-center gap-1 border border-gray-800 hover:border-gray-700 px-2.5 py-1.5 rounded transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catálogo Geral</span>
            </Link>
            <div className="h-4 w-px bg-gray-800" />
            <h1 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>
                {cleanCmd.toUpperCase()}
                {page ? `(${page.sectionName.split(' ')[0]})` : ''}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={man7SearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-200 border border-cyan-800/80 hover:border-cyan-600 bg-cyan-950/40 px-2.5 py-1.5 rounded transition flex items-center gap-1.5"
            >
              <span>man7.org</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              href={`/?topic=linux-basics`}
              className="text-xs bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold px-3 py-1.5 rounded transition flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Treinar no NetDrill</span>
            </Link>
          </div>
        </header>

        {isLoading ? (
          <div className="bg-[#0e121b] border border-gray-800 rounded-lg p-12 text-center space-y-4">
            <div className="text-cyan-400 font-bold text-sm tracking-wider">
              $ man {cleanCmd}
            </div>
            <div className="text-amber-400 font-bold text-xs flex items-center justify-center gap-2">
              <span className="inline-block animate-spin">⠋</span>
              <span>Consultando Nemotron AI e indexando manual para &quot;{cleanCmd}&quot; ({String(elapsedSeconds).padStart(2, '0')}s)...</span>
            </div>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Esse processo ocorre uma única vez. As próximas consultas serão imediatas.
            </p>
            <div className="pt-2">
              <a
                href={man7SearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
              >
                <span>Ou consultar diretamente no man7.org</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : page ? (
          <>
            {/* Terminal Header & Section Quick Links */}
            <div className="bg-[#10141f] border border-cyan-800/40 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">
                  MANUAL DO LINUX &middot; {page.title}
                </span>
                {page.source === 'ai_nemotron' ? (
                  <span className="text-[10px] bg-purple-950/80 border border-purple-700 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>IA Nemotron</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-950/80 border border-emerald-700 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                    Nativo NetDrill
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {page.source === 'ai_nemotron' && (
                  <button
                    type="button"
                    onClick={() => fetchPage(cleanCmd, true)}
                    className="text-[11px] text-gray-400 hover:text-amber-300 border border-gray-700 hover:border-amber-600 bg-[#0c0e14] px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerar com IA</span>
                  </button>
                )}

                <div className="flex items-center gap-2 text-cyan-400">
                  <a href="#synopsis" className="hover:underline">SINOPSE</a>
                  <a href="#description" className="hover:underline">DESCRIÇÃO</a>
                  <a href="#options" className="hover:underline">OPÇÕES</a>
                  <a href="#examples" className="hover:underline">EXEMPLOS</a>
                </div>
              </div>
            </div>

            {/* Manual Content in Classic Terminal Format */}
            <main className="bg-[#0e121b] border border-gray-800 rounded-lg p-6 space-y-6 text-sm">
              {/* NAME */}
              <section id="name">
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">NOME</h2>
                <p className="text-gray-300 pl-4">{page.title}</p>
              </section>

              {/* SYNOPSIS */}
              <section id="synopsis">
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">SINOPSE</h2>
                <div className="bg-[#06080d] border border-gray-850 rounded p-3 text-emerald-400 font-mono text-xs overflow-x-auto">
                  $ {page.synopsis}
                </div>
              </section>

              {/* DESCRIPTION */}
              <section id="description">
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">DESCRIÇÃO</h2>
                <p className="text-gray-300 pl-4 leading-relaxed whitespace-pre-line">
                  {page.description}
                </p>
              </section>

              {/* OPTIONS */}
              <section id="options">
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-3">OPÇÕES PRINCIPAIS</h2>
                <div className="space-y-2.5 pl-4">
                  {page.options.map((opt, idx) => {
                    const parts = opt.split(' : ');
                    const flag = parts[0];
                    const exp = parts.slice(1).join(' : ');
                    return (
                      <div key={idx} className="bg-[#121622] border border-cyan-800/40 p-2.5 rounded text-xs">
                        <span className="text-amber-300 font-bold font-mono">{flag}</span>
                        {exp && <p className="text-gray-300 mt-1 leading-relaxed">{exp}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* EXAMPLES */}
              <section id="examples">
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-3">EXEMPLOS PRÁTICOS EM PRODUÇÃO</h2>
                <div className="space-y-2 pl-4">
                  {page.examples.map((ex, idx) => (
                    <div key={idx} className="bg-[#06080d] border border-gray-850 rounded p-2.5 font-mono text-xs flex items-center justify-between group">
                      <span className="text-emerald-300">$ {ex}</span>
                    </div>
                  ))}
                </div>
              </section>
            </main>
          </>
        ) : (
          <div className="bg-[#0e121b] border border-gray-800 rounded-lg p-10 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-white font-bold">{errorMsg || 'Manual não encontrado.'}</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Você pode consultar a manpage oficial em inglês diretamente no repositório canônico man7.org:
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <a
                href={man7SearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded text-xs transition flex items-center gap-1.5"
              >
                <span>Buscar &quot;{cleanCmd}&quot; no man7.org via Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Link
                href="/man"
                className="bg-[#12151e] border border-gray-700 hover:border-gray-500 text-gray-300 px-3 py-2 rounded text-xs transition"
              >
                Voltar ao Catálogo
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-gray-600 border-t border-gray-850 pt-4">
          NetDrill Linux Manual Pages &middot; Síntese sob demanda com IA &amp; Cache Permanente
        </footer>
      </div>
    </div>
  );
}
