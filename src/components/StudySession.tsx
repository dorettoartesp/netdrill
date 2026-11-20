'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { QueueItem } from '@/lib/session';
import { compareBlock } from '@/lib/validator';
import { TimerHeader } from './TimerHeader';
import { TerminalPrompt } from './TerminalPrompt';
import { MobileKeyboardBar } from './MobileKeyboardBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trophy,
  Star,
  Flag,
} from 'lucide-react';

interface StudySessionProps {
  initialQueue: QueueItem[];
  initialMinutes?: number;
  selectedTopicSlugs?: string[];
}

/**
 * Main interactive study session container managing drill repetitions,
 * blind recall testing, SM-2 updates, timer pausing, item favoriting/flagging,
 * and state persistence across page leaves.
 */
export function StudySession({
  initialQueue,
  initialMinutes = 15,
  selectedTopicSlugs,
}: StudySessionProps) {
  const storageKey = `netdrill_session_${selectedTopicSlugs?.sort().join('_') || 'all'}`;

  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [repetitionCount, setRepetitionCount] = useState(1);
  const [isBlindTest, setIsBlindTest] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [completedItemsCount, setCompletedItemsCount] = useState(0);
  const [isSessionFinished, setIsSessionFinished] = useState(false);
  const [showStdout, setShowStdout] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Favoriting and Needs-Review state tracking
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(initialQueue.filter((i) => i.is_favorite).map((i) => i.id))
  );
  const [needsReviewSet, setNeedsReviewSet] = useState<Set<string>>(
    () => new Set(initialQueue.filter((i) => i.needs_review).map((i) => i.id))
  );

  // Resume saved question index on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.index === 'number' &&
          parsed.index >= 0 &&
          parsed.index < initialQueue.length
        ) {
          setCurrentIndex(parsed.index);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey, initialQueue.length]);

  // Persist current question index whenever it changes
  useEffect(() => {
    try {
      if (!isSessionFinished) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ index: currentIndex, timestamp: Date.now() })
        );
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [currentIndex, isSessionFinished, storageKey]);

  const currentItem = queue[currentIndex];
  const isCurrentFavorite = currentItem ? favorites.has(currentItem.id) : false;
  const isCurrentNeedsReview = currentItem ? needsReviewSet.has(currentItem.id) : false;

  const toggleFavorite = useCallback(async () => {
    if (!currentItem) return;
    const nextVal = !favorites.has(currentItem.id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (nextVal) next.add(currentItem.id);
      else next.delete(currentItem.id);
      return next;
    });

    try {
      await fetch('/api/progress/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: currentItem.id, isFavorite: nextVal }),
      });
    } catch (e) {
      console.error('Failed to update favorite status', e);
    }
  }, [currentItem, favorites]);

  const toggleNeedsReview = useCallback(async () => {
    if (!currentItem) return;
    const nextVal = !needsReviewSet.has(currentItem.id);
    setNeedsReviewSet((prev) => {
      const next = new Set(prev);
      if (nextVal) next.add(currentItem.id);
      else next.delete(currentItem.id);
      return next;
    });

    try {
      await fetch('/api/progress/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: currentItem.id, needsReview: nextVal }),
      });
    } catch (e) {
      console.error('Failed to update needsReview status', e);
    }
  }, [currentItem, needsReviewSet]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Global hotkeys: Ctrl+O (stdout), Ctrl+P or P (pause when not in textarea), Ctrl+F / Ctrl+R
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputActive =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setShowStdout((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        togglePause();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFavorite();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        toggleNeedsReview();
      } else if (!isInputActive) {
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          togglePause();
        } else if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          toggleFavorite();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          toggleNeedsReview();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, toggleFavorite, toggleNeedsReview]);

  const handleValidate = () => {
    if (!currentItem || isPaused) return;

    const inputLines = currentInput.split('\n').filter((l) => l.trim().length > 0);
    const result = compareBlock(inputLines, currentItem.target);

    if (result.isMatch) {
      if (isBlindTest) {
        // Blind test passed! Graduate item and schedule SM-2
        handleGraduateItem();
      } else {
        // Practice repetition passed!
        setFeedback({
          type: 'success',
          message: `Repetição #${repetitionCount} concluída com sucesso! Digite novamente ou :done para o teste cego.`,
        });
        setRepetitionCount((prev) => prev + 1);
        setCurrentInput('');
      }
    } else {
      setFeedback({
        type: 'error',
        message: result.expectedLine
          ? `Divergência na linha ${(result.mismatchLine || 0) + 1}. Esperado: "${result.expectedLine}"`
          : 'Sintaxe divergente do gabarito. Verifique e tente novamente.',
      });
    }
  };

  const handleTriggerDone = () => {
    if (isPaused) return;
    setIsBlindTest(true);
    setCurrentInput('');
    setFeedback({
      type: 'success',
      message: 'Gabarito ocultado! Digite a configuração completa de memória para validar.',
    });
  };

  const handleGraduateItem = async () => {
    if (!currentItem) return;

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: currentItem.id, grade: 5 }),
      });
    } catch (e) {
      console.error('Failed to save progress', e);
    }

    setCompletedItemsCount((prev) => prev + 1);

    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentInput('');
      setRepetitionCount(1);
      setIsBlindTest(false);
      setFeedback({
        type: 'success',
        message: 'Item graduado com sucesso! Próximo desafio carregado.',
      });
    } else {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      setIsSessionFinished(true);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (isSessionFinished || !currentItem) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mx-auto">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-mono text-white">Sessão Concluída!</h2>
        <p className="text-gray-400 text-sm font-mono">
          Você completou {completedItemsCount} exercícios de fixação muscular nesta sessão.
        </p>
        <div className="pt-4 flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} className="space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Iniciar Nova Sessão</span>
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/import')}>
            Importar Novos Tópicos
          </Button>
        </div>
      </div>
    );
  }

  const isMulti = currentItem.type === 'block' || currentItem.target.includes('\n');

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-6xl mx-auto p-4 md:p-6">
      <div>
        <TimerHeader
          initialMinutes={initialMinutes}
          onTimeExpired={() => setIsSessionFinished(true)}
          topicTitle={currentItem.title}
          onLogout={handleLogout}
          isPaused={isPaused}
          onTogglePause={togglePause}
        />

        <div className="space-y-4 my-4">
          {/* Objective Box with Favorite and Needs-Review Action Controls */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-wider">Cenário / Objetivo</span>
                  {currentItem.isDue && (
                    <span className="text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded text-[11px]">
                      Revisão Pendente
                    </span>
                  )}
                  {isCurrentFavorite && (
                    <span className="text-yellow-400 bg-yellow-950/60 border border-yellow-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 font-semibold">
                      ★ Favorito
                    </span>
                  )}
                  {isCurrentNeedsReview && (
                    <span className="text-red-400 bg-red-950/60 border border-red-800 px-2 py-0.5 rounded text-[11px] flex items-center gap-1 font-semibold">
                      ⚑ Revisar
                    </span>
                  )}
                </div>

                {/* Flagging Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    title="Favoritar questão (F ou Ctrl+F)"
                    className={`p-1.5 rounded transition border text-xs flex items-center gap-1 font-mono ${
                      isCurrentFavorite
                        ? 'bg-yellow-950/80 border-yellow-700 text-yellow-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        isCurrentFavorite ? 'fill-yellow-400 text-yellow-400' : ''
                      }`}
                    />
                    <span className="hidden sm:inline">Favoritar</span>
                    <kbd className="text-[9px] bg-black/40 px-1 py-0.5 rounded text-gray-400">
                      F
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={toggleNeedsReview}
                    title="Marcar que precisa de revisão (R ou Ctrl+R)"
                    className={`p-1.5 rounded transition border text-xs flex items-center gap-1 font-mono ${
                      isCurrentNeedsReview
                        ? 'bg-red-950/80 border-red-700 text-red-300'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                    }`}
                  >
                    <Flag
                      className={`w-3.5 h-3.5 ${
                        isCurrentNeedsReview ? 'fill-red-400 text-red-400' : ''
                      }`}
                    />
                    <span className="hidden sm:inline">Revisar</span>
                    <kbd className="text-[9px] bg-black/40 px-1 py-0.5 rounded text-gray-400">
                      R
                    </kbd>
                  </button>
                </div>
              </div>

              <h2 className="text-base font-semibold text-white font-mono">{currentItem.prompt}</h2>
              {currentItem.explanation && (
                <p className="text-xs text-gray-400 pt-1 leading-relaxed">
                  {currentItem.explanation}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
                feedback.type === 'success'
                  ? 'bg-green-950/60 border-green-800 text-green-300'
                  : 'bg-red-950/60 border-red-800 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Sample Terminal Output Preview */}
          {currentItem.output_sample && !isBlindTest && (
            <div className="bg-[#0f111a] border border-gray-800 rounded-lg p-3">
              <button
                type="button"
                onClick={() => setShowStdout((prev) => !prev)}
                className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-white transition font-mono focus:outline-none"
              >
                <span className="flex items-center gap-2">
                  <span className="text-green-400 font-bold">▶ [STDOUT]</span>
                  <span className="font-semibold text-white">
                    Exemplo de Resposta do Ambiente (Terminal Output)
                  </span>
                  <kbd className="bg-gray-800 text-[10px] px-1.5 py-0.5 rounded text-gray-400 border border-gray-700">
                    Ctrl+O
                  </kbd>
                </span>
                <span className="text-[11px] text-gray-500 hover:text-gray-300">
                  {showStdout ? 'Ocultar ▲' : 'Expandir ▼'}
                </span>
              </button>
              {showStdout && (
                <div className="mt-2.5 pt-2 border-t border-gray-800/80 font-mono text-xs text-green-300/90 bg-black/60 p-3 rounded overflow-x-auto leading-relaxed border border-gray-900 whitespace-pre">
                  {currentItem.output_sample}
                </div>
              )}
            </div>
          )}

          {/* Interactive Terminal (Disabled when paused) */}
          <div className="relative">
            {isPaused && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-lg border border-amber-800/60 text-center p-6 space-y-3 font-mono">
                <div className="text-amber-400 font-bold text-lg">⏸ Treino Pausado</div>
                <p className="text-xs text-gray-400 max-w-sm">
                  O tempo foi congelado e sua questão atual está preservada.
                </p>
                <Button onClick={togglePause} className="space-x-1.5">
                  <span>Retomar Treino</span>
                  <kbd className="text-xs bg-black/40 px-1.5 py-0.5 rounded ml-1">P</kbd>
                </Button>
              </div>
            )}

            <TerminalPrompt
              isMultiLine={isMulti}
              target={currentItem.target}
              value={currentInput}
              onChange={setCurrentInput}
              onSubmit={handleValidate}
              onExitTrigger={handleTriggerDone}
              isBlindTest={isBlindTest}
              repetitionCount={repetitionCount}
            />
          </div>
        </div>
      </div>

      <MobileKeyboardBar
        onInsertChar={(char) => setCurrentInput((prev) => prev + char)}
        onDoneTrigger={handleTriggerDone}
        onSubmit={handleValidate}
        onClear={() => setCurrentInput('')}
        isBlindTest={isBlindTest}
      />
    </div>
  );
}
