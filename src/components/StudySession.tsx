'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QueueItem } from '@/lib/session';
import { compareBlock } from '@/lib/validator';
import { parseAnnotatedOutput } from '@/lib/telemetry-glossary';
import { TimerHeader } from './TimerHeader';
import { TerminalPrompt } from './TerminalPrompt';
import { MobileKeyboardBar } from './MobileKeyboardBar';
import { AnnotatedOutput } from './AnnotatedOutput';
import { ManModal } from './ManModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trophy,
  Star,
  Flag,
  BookOpen,
  Terminal,
  Activity,
  Layers,
  Info,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

interface StudySessionProps {
  initialQueue: QueueItem[];
  initialMinutes?: number;
  selectedTopicSlugs?: string[];
}

interface UseCaseItem {
  title: string;
  description: string;
  severity?: 'info' | 'warning' | 'critical';
}

function getEffectiveUseCases(item: QueueItem): UseCaseItem[] {
  if (item.use_cases) {
    try {
      const parsed =
        typeof item.use_cases === 'string' ? JSON.parse(item.use_cases) : item.use_cases;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as UseCaseItem[];
      }
    } catch {
      // fallback below
    }
  }

  const baseCmd = item.target.trim().split(/\s+/)[0] || 'comando';
  return [
    {
      title: `Incidente de Produção: Investigação com ${baseCmd}`,
      description: `Alerta no Grafana ou PagerDuty acusando degradação no serviço. O comando "${item.target}" é executado imediatamente no terminal pelo engenheiro de SRE para isolar se a falha é saturação de recursos, processo zumbi ou contenção de I/O.`,
      severity: 'critical',
    },
    {
      title: `Auditoria de Conformidade e Troubleshooting`,
      description: `Durante inspeção operacional de rotina ou logo após um deploy, utilize "${item.target}" para certificar que os parâmetros de rede, estados de sockets ou privilégios de arquivos obedecem estritamente à política de segurança e alta disponibilidade.`,
      severity: 'info',
    },
  ];
}

/**
 * Main interactive study session container managing drill repetitions,
 * blind recall testing, educational tabs (Casos de Uso, STDOUT Anotado),
 * embedded man modal, SM-2 updates, and state persistence.
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
  const [showStdout, setShowStdout] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 3-Tab Educational Workspace State
  const [activeTab, setActiveTab] = useState<'treino' | 'casos' | 'stdout'>('treino');
  const [isManOpen, setIsManOpen] = useState(false);
  const [manCmd, setManCmd] = useState('ps');
  const [selectedMetricKey, setSelectedMetricKey] = useState<string | null>(null);

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

  // Derive initial command for man modal
  useEffect(() => {
    if (currentItem) {
      const base = currentItem.target.trim().split(/\s+/)[0] || 'ps';
      setManCmd(base);
    }
  }, [currentItem]);

  // Parse annotated STDOUT telemetry
  const parsedStdout = useMemo(() => {
    return parseAnnotatedOutput(currentItem?.output_sample || '', currentItem?.output_notes);
  }, [currentItem?.output_sample, currentItem?.output_notes]);

  // Set default selected metric when tab or item changes
  useEffect(() => {
    const keys = Object.keys(parsedStdout.activeMetrics);
    if (keys.length > 0) {
      setSelectedMetricKey(keys[0]);
    } else {
      setSelectedMetricKey(null);
    }
  }, [parsedStdout]);

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

  const handleExitBlindTest = useCallback(() => {
    setIsBlindTest(false);
    setFeedback({
      type: 'success',
      message: 'Gabarito restaurado. Continue treinando o comando.',
    });
  }, []);

  const handleOpenManModal = useCallback((cmd?: string) => {
    if (cmd && cmd.trim()) {
      setManCmd(cmd.trim().split(/\s+/)[0]);
    } else if (currentItem) {
      setManCmd(currentItem.target.trim().split(/\s+/)[0] || 'ps');
    }
    setIsManOpen(true);
  }, [currentItem]);

  // Global hotkeys: Ctrl+1 (treino), Ctrl+2 (casos), Ctrl+3 (stdout), Ctrl+M/M (man modal), Ctrl+O (stdout expand)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputActive =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setActiveTab('treino');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setActiveTab('casos');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        setActiveTab('stdout');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleOpenManModal();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
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
      } else if (e.key === 'Escape' && isBlindTest) {
        e.preventDefault();
        handleExitBlindTest();
      } else if (!isInputActive) {
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          handleOpenManModal();
        } else if (e.key.toLowerCase() === 'p') {
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
  }, [
    togglePause,
    toggleFavorite,
    toggleNeedsReview,
    isBlindTest,
    handleExitBlindTest,
    handleOpenManModal,
  ]);

  const handleGraduateItem = useCallback(async () => {
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
      setShowStdout(false);
      setActiveTab('treino');
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
  }, [currentItem, currentIndex, queue.length, storageKey]);

  const handleValidate = () => {
    if (!currentItem || isPaused || activeTab !== 'treino') return;

    const inputLines = currentInput.split('\n').filter((l) => l.trim().length > 0);
    const result = compareBlock(inputLines, currentItem.target);

    if (result.isMatch) {
      // Simulate real terminal execution by expanding STDOUT automatically
      setShowStdout(true);

      if (isBlindTest) {
        handleGraduateItem();
      } else {
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
    if (isPaused || activeTab !== 'treino') return;
    setIsBlindTest(true);
    setCurrentInput('');
    setFeedback({
      type: 'success',
      message: 'Gabarito ocultado! Digite a configuração completa de memória para validar.',
    });
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
  const isEducationalMode = activeTab !== 'treino' || isManOpen;
  const effectiveUseCases = getEffectiveUseCases(currentItem);

  const tabs: ReadonlyArray<{
    id: 'treino' | 'casos' | 'stdout';
    label: string;
    shortcut: string;
    Icon: typeof Terminal;
    active: string;
  }> = [
    { id: 'treino', label: 'Treino', shortcut: 'Ctrl+1', Icon: Terminal, active: 'lg:bg-emerald-950/80 lg:border-emerald-600 lg:text-emerald-300' },
    { id: 'casos', label: 'Casos de uso', shortcut: 'Ctrl+2', Icon: Layers, active: 'lg:bg-amber-950/80 lg:border-amber-600 lg:text-amber-300' },
    { id: 'stdout', label: 'Saída anotada', shortcut: 'Ctrl+3', Icon: Activity, active: 'lg:bg-cyan-950/80 lg:border-cyan-600 lg:text-cyan-300' },
  ];

  const pausedNotice = (tone: 'amber' | 'cyan', desktopText: string) => (
    <div
      role="status"
      className={`flex items-center justify-between gap-3 rounded-lg border pl-3 pr-1 py-1 lg:p-3 text-xs ${
        tone === 'amber'
          ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
          : 'bg-cyan-950/30 border-cyan-800/60 text-cyan-300'
      }`}
    >
      <span className="flex items-center gap-2">
        {tone === 'amber' ? (
          <AlertTriangle className="hidden lg:block w-4 h-4 flex-shrink-0" aria-hidden="true" />
        ) : (
          <Info className="hidden lg:block w-4 h-4 flex-shrink-0" aria-hidden="true" />
        )}
        <span className="lg:hidden">Cronômetro pausado</span>
        <span className="hidden lg:inline">{desktopText}</span>
      </span>
      <button
        type="button"
        onClick={() => setActiveTab('treino')}
        className={`min-h-[40px] lg:min-h-0 px-3 lg:px-2.5 lg:py-1 rounded font-bold text-xs transition cursor-pointer lg:text-black ${
          tone === 'amber' ? 'text-amber-400 lg:bg-amber-500 lg:hover:bg-amber-400' : 'text-cyan-400 lg:bg-cyan-500 lg:hover:bg-cyan-400'
        }`}
      >
        Voltar ao treino<span className="hidden lg:inline"> (Ctrl+1)</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-6xl mx-auto px-4 pt-0 lg:p-6 font-mono text-gray-200">
      <div>
        <TimerHeader
          initialMinutes={initialMinutes}
          onTimeExpired={() => setIsSessionFinished(true)}
          topicTitle={
            isManOpen
              ? `[PAUSADO (MAN)] ${currentItem.title}`
              : activeTab !== 'treino'
              ? `[EM ESTUDO] ${currentItem.title}`
              : currentItem.title
          }
          onLogout={handleLogout}
          isPaused={isPaused || isEducationalMode}
          onTogglePause={togglePause}
          currentIndex={currentIndex}
          totalItems={queue.length}
        />

        {/* Study modes: equal segmented control on mobile, labelled tabs with shortcuts on desktop */}
        <div className="flex items-center justify-between gap-2 pt-2 lg:pt-0 lg:border-b lg:border-gray-800 lg:pb-3 lg:mb-4">
          <nav
            aria-label="Modos de estudo"
            className="grid grid-cols-3 flex-1 gap-1 p-1 rounded-xl bg-[#161922] border border-[#262b3d] lg:flex lg:flex-none lg:gap-2 lg:p-0 lg:bg-transparent lg:border-0"
          >
            {tabs.map(({ id, label, shortcut, Icon, active }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab(id)}
                  className={`min-h-[40px] lg:min-h-0 px-2 lg:px-3 lg:py-1.5 rounded-lg lg:rounded text-[13px] lg:text-xs font-sans lg:font-mono transition flex items-center justify-center gap-1.5 cursor-pointer lg:border ${
                    isActive
                      ? `bg-[#0c0e14] text-slate-50 font-semibold shadow-[0_0_0_1px_#262b3d] lg:shadow-none ${active}`
                      : 'text-slate-400 font-medium hover:text-slate-200 lg:bg-[#10141f] lg:border-gray-800 lg:hover:border-gray-700'
                  }`}
                >
                  <Icon className="hidden lg:block w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden lg:inline">[ {shortcut} ]</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => handleOpenManModal()}
            className="hidden lg:flex bg-[#12151e] hover:bg-[#1a202c] border border-cyan-500/50 text-cyan-400 px-3 py-1.5 rounded font-bold text-xs items-center gap-1.5 transition cursor-pointer shadow"
            title="Pressione M para abrir o manual de qualquer comando"
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>[ M ] Manual (man)</span>
          </button>
        </div>

        {/* Tab 2: Casos de Uso em Produção */}
        {activeTab === 'casos' && (
          <div className="space-y-3 my-3 lg:space-y-4 lg:my-4">
            {pausedNotice('amber', 'O cronômetro do treino está pausado enquanto você estuda os cenários reais de aplicação.')}

            <div className="space-y-3">
              {effectiveUseCases.map((uc, idx) => {
                const isCritical = uc.severity === 'critical';
                const cardBorder = isCritical ? 'border-red-800/60' : 'border-amber-800/60';
                const badgeColor = isCritical
                  ? 'bg-red-950/80 border-red-800 text-red-300'
                  : 'bg-amber-950/80 border-amber-800 text-amber-300';

                return (
                  <div key={idx} className={`bg-[#0f121a] border ${cardBorder} rounded-lg p-3 lg:p-4 space-y-2`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-white font-bold text-sm">{uc.title}</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                        {isCritical ? 'Alerta de Produção' : 'Rotina & Troubleshooting'}
                      </span>
                    </div>

                    <p className="text-[13px] lg:text-xs font-sans lg:font-mono text-gray-300 leading-relaxed">{uc.description}</p>

                    <div className="bg-[#07090e] border border-gray-800 rounded p-2 text-xs font-mono text-emerald-300 flex items-start justify-between gap-2">
                      <code className="whitespace-pre-wrap break-all">$ {currentItem.target}</code>
                      <span className="hidden lg:inline shrink-0 text-[10px] text-gray-500">Comando em estudo</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: STDOUT Anotado & Telemetria */}
        {activeTab === 'stdout' && (
          <div className="flex flex-col gap-2 my-2 lg:gap-4 lg:my-4">
            <div className="hidden lg:block">
              {pausedNotice('cyan', 'O cronômetro do treino está pausado. Clique nos tokens sublinhados para inspecionar métricas.')}
            </div>

            <div className="flex flex-col gap-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start">
              <AnnotatedOutput
                command={currentItem.target}
                segments={parsedStdout.segments}
                selectedKey={selectedMetricKey}
                onSelect={setSelectedMetricKey}
              />

              {/* Telemetry Inspector */}
              <section
                aria-label="Inspetor de telemetria"
                aria-live="polite"
                className="shrink-0 bg-[#161922] lg:bg-[#0f121a] border border-gray-800 rounded-lg p-3 lg:p-4 space-y-2 lg:space-y-3"
              >
                <div className="hidden lg:flex items-center justify-between border-b border-gray-800 pb-2 text-xs">
                  <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Inspetor de Telemetria</span>
                  </span>
                  <span className="text-gray-500">Linha de Base & Anomalias</span>
                </div>

                {selectedMetricKey && parsedStdout.activeMetrics[selectedMetricKey] ? (
                  (() => {
                    const m = parsedStdout.activeMetrics[selectedMetricKey];
                    const isCritical = m.severity === 'critical';
                    const isWarning = m.severity === 'warning';
                    const badgeColor = isCritical
                      ? 'bg-red-950 text-red-300 border-red-700'
                      : isWarning
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-700';

                    return (
                      <div className="space-y-2 lg:space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base lg:text-sm font-bold text-white font-mono">{m.label}</span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                            {m.severity}
                          </span>
                        </div>

                        <p className="text-sm lg:text-xs font-sans lg:font-mono text-gray-300 leading-relaxed">{m.description}</p>

                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                          <div className="bg-[#0f1a14] lg:bg-[#121622] border border-emerald-800/40 p-2.5 rounded">
                            <span className="text-emerald-400 font-bold block mb-1">Linha de base normal</span>
                            <span className="text-gray-300 font-sans lg:font-mono">{m.normalBaseline}</span>
                          </div>
                          <div className="bg-[#1f0f12] lg:bg-[#121622] border border-red-800/40 p-2.5 rounded">
                            <span className="text-red-400 font-bold block mb-1">Alerta de anomalia</span>
                            <span className="text-gray-300 font-sans lg:font-mono">{m.anomalyAlert}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="py-6 lg:py-8 text-center text-xs text-gray-400">
                    Selecione uma métrica destacada na saída para inspecionar sua linha de base.
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* Tab 1: Treino (Core Muscle Memory Drill) */}
        {activeTab === 'treino' && (
          <div className="space-y-3 my-3 lg:space-y-4 lg:my-4">
            {/* Scenario with favorite and needs-review toggles */}
            <Card>
              <CardContent className="p-3 lg:p-4 space-y-2">
                <div className="flex justify-between items-center gap-2 text-xs text-slate-400 font-mono">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="uppercase tracking-wider font-bold">Cenário<span className="hidden lg:inline"> / Objetivo</span></span>
                    {currentItem.isDue && (
                      <span className="text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                        Revisão Pendente
                      </span>
                    )}
                    {isCurrentFavorite && (
                      <span className="hidden lg:flex text-yellow-400 bg-yellow-950/60 border border-yellow-800 px-2 py-0.5 rounded text-xs items-center gap-1 font-semibold">
                        Favorito
                      </span>
                    )}
                    {isCurrentNeedsReview && (
                      <span className="hidden lg:flex text-red-400 bg-red-950/60 border border-red-800 px-2 py-0.5 rounded text-xs items-center gap-1 font-semibold">
                        Revisar
                      </span>
                    )}
                  </div>

                  <div className="flex items-center lg:gap-2 -mr-2 lg:mr-0">
                    <button
                      type="button"
                      onClick={toggleFavorite}
                      aria-label="Favoritar exercício"
                      aria-pressed={isCurrentFavorite}
                      title="Favoritar questão (F ou Ctrl+F)"
                      className={`min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 justify-center lg:p-1.5 rounded transition lg:border text-xs flex items-center gap-1 font-mono cursor-pointer ${
                        isCurrentFavorite
                          ? 'text-yellow-300 lg:bg-yellow-950/80 lg:border-yellow-700'
                          : 'text-gray-400 hover:text-white lg:bg-gray-800 lg:border-gray-700'
                      }`}
                    >
                      <Star className={`w-5 h-5 lg:w-3.5 lg:h-3.5 ${isCurrentFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} aria-hidden="true" />
                      <span className="hidden lg:inline">Favoritar</span>
                      <kbd className="hidden lg:inline text-[9px] bg-black/40 px-1 py-0.5 rounded text-gray-400">F</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={toggleNeedsReview}
                      aria-label="Marcar para revisão"
                      aria-pressed={isCurrentNeedsReview}
                      title="Marcar que precisa de revisão (R ou Ctrl+R)"
                      className={`min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 justify-center lg:p-1.5 rounded transition lg:border text-xs flex items-center gap-1 font-mono cursor-pointer ${
                        isCurrentNeedsReview
                          ? 'text-red-300 lg:bg-red-950/80 lg:border-red-700'
                          : 'text-gray-400 hover:text-white lg:bg-gray-800 lg:border-gray-700'
                      }`}
                    >
                      <Flag className={`w-5 h-5 lg:w-3.5 lg:h-3.5 ${isCurrentNeedsReview ? 'fill-red-400 text-red-400' : ''}`} aria-hidden="true" />
                      <span className="hidden lg:inline">Revisar</span>
                      <kbd className="hidden lg:inline text-[9px] bg-black/40 px-1 py-0.5 rounded text-gray-400">R</kbd>
                    </button>
                  </div>
                </div>

                <h2 className="text-[17px] lg:text-base leading-snug font-semibold text-white font-sans lg:font-mono">{currentItem.prompt}</h2>
                {currentItem.explanation && (
                  <p className="text-[13px] lg:text-xs font-sans lg:font-mono text-slate-400 pt-1 leading-relaxed">
                    {currentItem.explanation}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Feedback Banner */}
            {feedback && (
              <div
                role="status"
                className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-green-950/60 border-green-800 text-green-300'
                    : 'bg-red-950/60 border-red-800 text-red-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                )}
                <span className="break-words min-w-0">{feedback.message}</span>
              </div>
            )}

            {/* Sample Terminal Output Preview (Collapsed by Default) */}
            {currentItem.output_sample && !isBlindTest && (
              <div className="bg-[#0f111a] border border-gray-800 rounded-lg px-3 lg:p-3">
                <button
                  type="button"
                  aria-expanded={showStdout}
                  onClick={() => setShowStdout((prev) => !prev)}
                  className="min-h-[48px] lg:min-h-0 flex items-center justify-between w-full text-xs text-gray-400 hover:text-white transition font-mono focus:outline-none cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">[STDOUT]</span>
                    <span className="font-semibold text-white">
                      Exemplo de saída<span className="hidden lg:inline"> do ambiente (Terminal Output)</span>
                    </span>
                    <kbd className="hidden lg:inline bg-gray-800 text-[10px] px-1.5 py-0.5 rounded text-gray-400 border border-gray-700">
                      Ctrl+O
                    </kbd>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200">
                    <span className="hidden lg:inline">{showStdout ? 'Ocultar' : 'Mostrar'}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showStdout ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </span>
                </button>
                {showStdout && (
                  <div className="mb-3 lg:mb-0 lg:mt-2.5 font-mono text-xs text-slate-300 bg-[#0c0e14] p-3 border border-cyan-800/50 overflow-x-auto leading-relaxed whitespace-pre rounded">
                    {currentItem.output_sample}
                  </div>
                )}
              </div>
            )}

            {/* Interactive Terminal (Disabled when paused) */}
            <div className="relative">
              {isPaused && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-lg border border-amber-800/60 text-center p-6 space-y-3 font-mono">
                  <div className="text-amber-400 font-bold text-lg">Treino pausado</div>
                  <p className="text-xs text-gray-400 max-w-sm">
                    O tempo foi congelado e sua questão atual está preservada.
                  </p>
                  <Button onClick={togglePause} className="space-x-1.5 min-h-[44px]">
                    <span>Retomar Treino</span>
                    <kbd className="hidden lg:inline text-xs bg-black/40 px-1.5 py-0.5 rounded ml-1">P</kbd>
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
                onExitBlindTest={handleExitBlindTest}
                isBlindTest={isBlindTest}
                repetitionCount={repetitionCount}
                onOpenMan={handleOpenManModal}
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'treino' && (
        <MobileKeyboardBar
          onInsertChar={(char) => setCurrentInput((prev) => prev + char)}
          onDoneTrigger={handleTriggerDone}
          onSubmit={handleValidate}
          isBlindTest={isBlindTest}
          onExitBlindTest={handleExitBlindTest}
          onOpenMan={() => handleOpenManModal()}
        />
      )}

      {/* Floating Terminal Man Modal */}
      <ManModal
        isOpen={isManOpen}
        initialCommand={manCmd}
        onClose={() => setIsManOpen(false)}
      />
    </div>
  );
}
