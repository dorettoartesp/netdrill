'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getManPage, ManPage } from '@/lib/man-engine';
import { Search, X, BookOpen, AlertCircle } from 'lucide-react';

interface ManModalProps {
  isOpen: boolean;
  initialCommand?: string;
  onClose: () => void;
}

const COMMON_COMMANDS = ['ps', 'top', 'ss', 'ip', 'find', 'journalctl', 'systemctl', 'chmod', 'iptables', 'tcpdump', 'curl', 'vmstat'];

export function ManModal({ isOpen, initialCommand = 'ps', onClose }: ManModalProps) {
  const [query, setQuery] = useState(initialCommand);
  const [activeCmd, setActiveCmd] = useState(initialCommand);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update query when initialCommand changes
  useEffect(() => {
    if (initialCommand) {
      const clean = initialCommand.trim().split(/\s+/)[0];
      setQuery(clean);
      setActiveCmd(clean);
    }
  }, [initialCommand]);

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

  const manPage: ManPage | null = getManPage(activeCmd);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setActiveCmd(query.trim());
    }
  };

  const handleSelectCommand = (cmd: string) => {
    setQuery(cmd);
    setActiveCmd(cmd);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="man-modal-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-[#0c0e14] border-2 border-cyan-500/60 rounded max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl font-mono text-gray-200">
        {/* Modal Header */}
        <div className="p-3 border-b border-[#1e2433] bg-[#12151e] flex flex-wrap items-center justify-between gap-2">
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-cyan-400 font-bold text-sm sm:text-base">$ man</span>
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="digite o comando (ex: ps, ss, top, iptables)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#0c0e14] border border-[#1e2433] text-white px-2.5 py-1 rounded text-xs sm:text-sm outline-none focus:border-cyan-400 font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
            </button>
          </form>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-400 hidden md:inline">
              <kbd className="bg-[#0c0e14] border border-[#1e2433] px-1 py-0.5 rounded text-white text-[10px]">Esc</kbd> ou <kbd className="bg-[#0c0e14] border border-[#1e2433] px-1 py-0.5 rounded text-white text-[10px]">q</kbd> para fechar
            </span>
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
          {manPage ? (
            <>
              {/* Terminal Title Bar */}
              <div className="flex justify-between border-b border-[#1e2433] pb-1.5 text-white font-bold text-xs">
                <span>{manPage.command.toUpperCase()}({manPage.sectionName.split(' ')[0]})</span>
                <span className="hidden sm:inline text-gray-400 font-normal">{manPage.sectionName}</span>
                <span>{manPage.command.toUpperCase()}({manPage.sectionName.split(' ')[0]})</span>
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
                <div className="pl-4 space-y-1.5">
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
                <div className="pl-4 space-y-1.5">
                  {manPage.examples.map((ex, idx) => (
                    <div key={idx} className="bg-[#06080d] border border-gray-850 rounded p-2 text-emerald-300 font-mono text-xs">
                      $ {ex}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-white font-bold">Manual para &quot;{activeCmd}&quot; não encontrado localmente.</p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                No momento, o NetDrill embute os utilitários de produção mais críticos: {COMMON_COMMANDS.join(', ')}.
              </p>
              <button
                type="button"
                onClick={() => handleSelectCommand('ps')}
                className="mt-2 text-xs text-cyan-400 hover:underline inline-block cursor-pointer font-bold"
              >
                &larr; Voltar para manual do comando ps
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-2.5 border-t border-[#1e2433] bg-[#12151e] flex justify-between items-center text-xs text-gray-400">
          <span className="flex items-center gap-1.5 text-cyan-400 text-[11px]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Leitor do manual do Linux (modo offline / instantâneo)</span>
          </span>
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
  );
}
