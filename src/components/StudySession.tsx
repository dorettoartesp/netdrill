'use client';

import React, { useState } from 'react';
import { QueueItem } from '@/lib/session';
import { compareBlock } from '@/lib/validator';
import { TimerHeader } from './TimerHeader';
import { TerminalPrompt } from './TerminalPrompt';
import { MobileKeyboardBar } from './MobileKeyboardBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, RefreshCw, Trophy, ArrowRight } from 'lucide-react';

interface StudySessionProps {
  initialQueue: QueueItem[];
}

/**
 * Main interactive study session container managing drill repetitions,
 * blind recall testing, SM-2 updates, and session completion.
 */
export function StudySession({ initialQueue }: StudySessionProps) {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [repetitionCount, setRepetitionCount] = useState(1);
  const [isBlindTest, setIsBlindTest] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [completedItemsCount, setCompletedItemsCount] = useState(0);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  const currentItem = queue[currentIndex];

  const handleValidate = () => {
    if (!currentItem) return;

    const isMultiLine = currentItem.type === 'block' || currentItem.target.includes('\n');
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
        <p className="text-gray-400 text-sm">
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
          initialMinutes={15}
          onTimeExpired={() => setIsSessionFinished(true)}
          topicTitle={currentItem.title}
          onLogout={handleLogout}
        />

        <div className="space-y-4 my-4">
          {/* Objective Box */}
          <Card>
            <CardContent className="p-4 space-y-1.5">
              <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                <span className="uppercase tracking-wider">Cenário / Objetivo</span>
                {currentItem.isDue && (
                  <span className="text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded text-[11px]">
                    Revisão Pendente
                  </span>
                )}
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

          {/* Interactive Terminal */}
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

      <MobileKeyboardBar
        onInsertChar={(char) => setCurrentInput((prev) => prev + char)}
        onDoneTrigger={handleTriggerDone}
      />
    </div>
  );
}
