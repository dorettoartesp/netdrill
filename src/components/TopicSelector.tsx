'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TopicSummary } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { PlusCircle, LogOut, Check, ArrowRight } from 'lucide-react';

interface TopicSelectorProps {
  /** List of registered topics loaded from the database. */
  topics: TopicSummary[];
}

/**
 * Lobby dashboard allowing the user to select specific topics before launching a study session.
 * Fully operable via keyboard shortcuts (1-9 to toggle topics, A to select all, Enter to start).
 */
export function TopicSelector({ topics }: TopicSelectorProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(
    () => new Set(topics.map((t) => t.slug))
  );

  const toggleTopic = useCallback((slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedSlugs(new Set(topics.map((t) => t.slug)));
  }, [topics]);

  const clearAll = useCallback(() => {
    setSelectedSlugs(new Set());
  }, []);

  const handleStart = useCallback(() => {
    if (selectedSlugs.size === 0) return;
    const slugs = Array.from(selectedSlugs).join(',');
    window.location.href = `/?topics=${encodeURIComponent(slugs)}`;
  }, [selectedSlugs]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check number keys 1 to topics.length
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= topics.length) {
        e.preventDefault();
        toggleTopic(topics[num - 1].slug);
      } else if (e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleStart();
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        window.location.href = '/import';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [topics, toggleTopic, selectAll, handleStart]);

  const totalSelectedItems = topics
    .filter((t) => selectedSlugs.has(t.slug))
    .reduce((sum, t) => sum + t.itemCount, 0);

  return (
    <div className="min-h-screen bg-[#0c0e14] text-[#e2e8f0] flex flex-col justify-between p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-gray-800 pb-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <span className="text-green-400 font-bold text-xl tracking-wider font-mono">
            NetDrill
          </span>
          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded font-mono">
            Painel de Estudo
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/import"
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded transition flex items-center gap-1 font-mono"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Importar Decks</span>
            <kbd className="text-[10px] bg-gray-800 px-1 rounded ml-1 text-gray-300">I</kbd>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1 font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="my-auto max-w-5xl mx-auto w-full py-8 space-y-6">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-green-400 font-bold font-mono">
            Fase de Preparação
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-mono">
            Selecione os Tópicos para o Treino
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            Escolha quais assuntos você deseja praticar hoje. Use o teclado (
            <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">1</kbd>,{' '}
            <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">2</kbd>,{' '}
            <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">3</kbd>
            ) ou clique nos cartões para alternar.
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-y border-gray-800/80 py-3 font-mono">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded transition font-medium"
            >
              Selecionar Todos <kbd className="text-[10px] bg-gray-900 px-1 rounded ml-1">A</kbd>
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded transition"
            >
              Desmarcar Todos
            </button>
          </div>

          <div className="text-xs text-gray-400">
            <span>{topics.length} tópicos cadastrados</span>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic, index) => {
            const isSelected = selectedSlugs.has(topic.slug);
            const hotkey = index < 9 ? String(index + 1) : null;

            return (
              <div
                key={topic.id}
                onClick={() => toggleTopic(topic.slug)}
                className={`cursor-pointer border-2 p-5 rounded-lg flex flex-col justify-between transition group relative select-none shadow-md ${
                  isSelected
                    ? 'border-green-500 bg-gray-900/70 hover:bg-gray-900'
                    : 'border-gray-800 bg-[#12141c]/60 hover:bg-[#12141c]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm font-mono ${
                      isSelected
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {hotkey || index + 1}
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                      isSelected
                        ? 'bg-green-900/60 text-green-300 border border-green-700 font-semibold'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 font-normal'
                    }`}
                  >
                    {isSelected ? 'Selecionado ✓' : 'Não Selecionado'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2
                    className={`text-base font-bold font-mono transition ${
                      isSelected ? 'text-white group-hover:text-green-300' : 'text-gray-400'
                    }`}
                  >
                    {topic.title}
                  </h2>
                  {topic.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {topic.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-[11px] font-mono text-gray-500">
                  <span>{topic.itemCount} exercícios</span>
                  {topic.dueCount > 0 ? (
                    <span className="text-amber-400">{topic.dueCount} revisão(ões)</span>
                  ) : (
                    <span className="text-green-400">Em dia</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Button & Summary */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-400 flex items-center gap-2 font-mono">
            <span>Resumo:</span>
            <strong className="text-white font-bold">
              {selectedSlugs.size} tópico(s) ({totalSelectedItems} exercícios)
            </strong>
            <span>selecionados.</span>
          </div>

          <Button
            onClick={handleStart}
            disabled={selectedSlugs.size === 0}
            className="w-full sm:w-auto px-8 py-3 text-sm font-bold flex items-center justify-center gap-2"
          >
            <span>Iniciar Treino de Fixação</span>
            <ArrowRight className="w-4 h-4 ml-1" />
            <kbd className="bg-green-700/60 text-black px-1.5 py-0.5 rounded text-xs font-mono font-normal">
              Enter ↵
            </kbd>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 pt-4 max-w-5xl mx-auto w-full text-xs text-gray-500 flex flex-wrap justify-between items-center gap-2 font-mono">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">1-{topics.length}</kbd>{' '}
            Alternar Tópico
          </span>
          <span>
            <kbd className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">A</kbd> Selecionar
            Todos
          </span>
          <span>
            <kbd className="bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">Enter</kbd> Iniciar
          </span>
        </div>
        <div>NetDrill &bull; Repetição Espaçada &amp; Memória Muscular</div>
      </footer>
    </div>
  );
}
