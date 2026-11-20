'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getManPage, ManPage } from '@/lib/man-engine';
import { Search, X, BookOpen, AlertCircle, RefreshCw, ExternalLink, Sparkles } from 'lucide-react';

interface ManModalProps {
  isOpen: boolean;
  initialCommand?: string;
  onClose: () => void;
}

interface LoadedManPage extends ManPage {
  source?: 'bundled' | 'ai_nemotron';
  man7Url?: string;
}

const COMMON_COMMANDS = ['ps', 'top', 'ss', 'ip', 'find', 'journalctl', 'systemctl', 'chmod', 'iptables', 'tcpdump', 'curl', 'vmstat'];

export function ManModal({ isOpen, initialCommand = 'ps', onClose }: ManModalProps) {
  const [query, setQuery] = useState(initialCommand);
  const [activeCmd, setActiveCmd] = useState(initialCommand);
  const [manPage, setManPage] = useState<LoadedManPage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchManPage = useCallback(async (cmd: string, forceRefresh = false) => {
    const clean = cmd.trim().toLowerCase().split(/\s+/)[0];
    if (!clean) return;

    // Check bundled static first (unless force refreshing non-bundled)
    const staticPage = getManPage(clean);
    if (staticPage && !forceRefresh) {
      setManPage({ ...staticPage, source: 'bundled' });
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setElapsedSeconds(0);
    setErrorMessage(null);

    try {
      const url = `/api/man/${encodeURIComponent(clean)}${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Manual não encontrado para este comando.');
        setManPage(null);
      } else {
        setManPage(data);
        setErrorMessage(null);
      }
    } catch (err) {
      console.error('[ManModal] Fetch error:', err);
      setErrorMessage('Falha ao conectar com o serviço de manuais.');
      setManPage(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update command when initialCommand changes
  useEffect(() => {
    if (initialCommand) {
      const clean = initialCommand.trim().split(/\s+/)[0];
      setQuery(clean);
      setActiveCmd(clean);
      fetchManPage(clean);
    }
  }, [initialCommand, fetchManPage]);

  // Elapsed seconds timer during generation
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // Handle keyboard shortcuts: Esc and q (when not typing in input)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'q' || e.key === 'Q') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const clean = query.trim().split(/\s+/)[0];
      setActiveCmd(clean);
      fetchManPage(clean);
    }
  };

  const handleSelectCommand = (cmd: string) => {
    setQuery(cmd);
    setActiveCmd(cmd);
    fetchManPage(cmd);
  };

  const man7SearchUrl = `https://www.google.com/search?q=${encodeURIComponent(activeCmd + ' site:man7.org/linux/man-pages')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="man-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 font-mono text-gray-200"
    >
      <div className="bg-[#0c0e14] border-2 border-cyan-500/60 rounded max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-3 border-b border-[#1e2433] bg-[#12151e] flex flex-wrap items-center justify-between gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-cyan-400 font-bold text-sm sm:text-base">$ man</span>
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="digite qualquer comando (ex: rsync, strace, jq, ps)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#0c0e14] border border-[#1e2433] text-white px-2.5 py-1 rounded text-xs sm:text-sm outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
            </button>
          </form>

          <div className="flex items-center gap-2">
            <a
              href={man7SearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Consultar manual oficial no man7.org (abre em nova aba)"
              className="text-[11px] text-cyan-400 hover:text-cyan-200 border border-cyan-800/80 hover:border-cyan-600 bg-cyan-950/40 px-2 py-1 rounded transition flex items-center gap-1"
            >
              <span>man7.org</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded border border-[#1e2433] bg-[#0c0e14] hover:bg-gray-800 transition cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Command Navigation Pills */}
        <div className="bg-[#0e121a] px-3 py-1.5 border-b border-[#1e2433] flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-gray-500 whitespace-nowrap">Comandos rápidos:</span>
          {COMMON_COMMANDS.map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => handleSelectCommand(cmd)}
              className={`px-1.5 py-0.5 rounded border transition cursor-pointer whitespace-nowrap ${
                activeCmd.toLowerCase() === cmd
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-[#12151e] border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Modal Body / Man Page Reader */}
        <div className="p-4 sm:p-6 overflow-y-auto text-xs text-gray-300 leading-relaxed space-y-4 flex-1 select-text">
          {isLoading ? (
            <div className="py-12 px-4 text-center space-y-4">
              <div className="text-cyan-400 font-bold text-sm tracking-wider">
                $ man {activeCmd}
              </div>
              <div className="text-amber-400 font-bold text-xs flex items-center justify-center gap-2">
                <span className="inline-block animate-spin">⠋</span>
                <span>Consultando Nemotron AI e indexando manual para &quot;{activeCmd}&quot; ({String(elapsedSeconds).padStart(2, '0')}s)...</span>
              </div>
              <p className="text-[11px] text-gray-500 max-w-md mx-auto">
                💡 Esse processo ocorre apenas uma vez. As próximas consultas serão instantâneas pelo banco de dados.
              </p>
              <a
                href={man7SearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline pt-2"
              >
                <span>Ou consultar diretamente no man7.org</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : manPage ? (
            <>
              {/* Terminal Title Bar with Source Badge and Regeneration */}
              <div className="flex flex-wrap items-center justify-between border-b border-[#1e2433] pb-2 text-white font-bold text-xs gap-2">
                <div className="flex items-center gap-2">
                  <span>{manPage.command.toUpperCase()}({manPage.sectionName.split(' ')[0]})</span>
                  {manPage.source === 'ai_nemotron' ? (
                    <span className="text-[10px] bg-purple-950/80 border border-purple-700 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>Gerado via IA (Nemotron)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-950/80 border border-emerald-700 text-emerald-300 px-2 py-0.5 rounded font-semibold">
                      Manual Nativo NetDrill
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {manPage.source === 'ai_nemotron' && (
                    <button
                      type="button"
                      onClick={() => fetchManPage(activeCmd, true)}
                      title="Forçar o agente Nemotron a regenerar este manual"
                      className="text-[11px] text-gray-400 hover:text-amber-300 border border-gray-700 hover:border-amber-600 bg-[#12151e] px-2 py-1 rounded transition flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerar com IA</span>
                    </button>
                  )}

                  <a
                    href={man7SearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Ver no man7.org</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* NAME */}
              <div id="man-modal-title">
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-1">NOME</h2>
                <p className="pl-4 text-white font-medium">{manPage.title}</p>
              </div>

              {/* SYNOPSIS */}
              <div>
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-1">SINOPSE</h2>
                <div className="bg-[#06080d] border border-gray-850 rounded p-2.5 text-emerald-400 font-mono text-xs overflow-x-auto">
                  $ {manPage.synopsis}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-1">DESCRIÇÃO</h2>
                <p className="pl-4 text-gray-300 whitespace-pre-line leading-relaxed">
                  {manPage.description}
                </p>
              </div>

              {/* OPTIONS */}
              <div>
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">OPÇÕES FREQUENTES EM PRODUÇÃO</h2>
                <div className="space-y-1.5 pl-4">
                  {manPage.options.map((opt, idx) => {
                    const parts = opt.split(' : ');
                    const flag = parts[0];
                    const exp = parts.slice(1).join(' : ');
                    return (
                      <div key={idx} className="bg-[#121622] border border-cyan-800/40 p-2 rounded">
                        <span className="text-amber-300 font-bold font-mono">{flag}</span>
                        {exp && <p className="text-gray-300 mt-0.5 leading-relaxed">{exp}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* EXAMPLES */}
              <div>
                <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">EXEMPLOS PRÁTICOS</h2>
                <div className="space-y-1.5 pl-4">
                  {manPage.examples.map((ex, idx) => (
                    <div key={idx} className="bg-[#06080d] border border-gray-850 rounded p-2 text-emerald-300 font-mono text-xs">
                      $ {ex}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 space-y-4">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-white font-bold">
                {errorMessage || `Manual para "${activeCmd}" não encontrado.`}
              </p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Você pode consultar a documentação original em inglês do Linux diretamente no repositório canônico man7.org:
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={man7SearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded text-xs transition flex items-center gap-1.5"
                >
                  <span>Buscar &quot;{activeCmd}&quot; no man7.org via Google</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => handleSelectCommand('ps')}
                  className="bg-[#12151e] border border-gray-700 hover:border-gray-500 text-gray-300 px-3 py-2 rounded text-xs transition cursor-pointer"
                >
                  Voltar para manual do ps
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-2.5 border-t border-[#1e2433] bg-[#12151e] flex flex-wrap justify-between items-center text-xs text-gray-400 gap-2">
          <span className="flex items-center gap-1.5 text-cyan-400 text-[11px]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Leitor Linux com síntese JIT via Nemotron AI</span>
          </span>

          <div className="flex items-center gap-3">
            <a
              href="https://man7.org/linux/man-pages/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-300 text-[11px] flex items-center gap-1"
            >
              <span>Índice man7.org</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="bg-[#1e2433] hover:bg-[#283144] text-white px-3 py-1 rounded text-xs transition cursor-pointer"
            >
              Fechar [Esc / q]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
