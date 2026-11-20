'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, LogOut, LayoutGrid, Pause, Play } from 'lucide-react';

interface TimerHeaderProps {
  initialMinutes?: number;
  onTimeExpired?: () => void;
  topicTitle?: string;
  onLogout?: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  currentIndex?: number;
  totalItems?: number;
}

/**
 * Top application header containing the brand identifier, topic breadcrumb,
 * queue progress indicator (Fila: X / Y), session countdown timer with pause/resume support,
 * and topic navigation.
 */
export function TimerHeader({
  initialMinutes = 15,
  onTimeExpired,
  topicTitle = 'Treino Ativo',
  onLogout,
  isPaused = false,
  onTogglePause,
  currentIndex,
  totalItems,
}: TimerHeaderProps) {
  const isUnlimited = initialMinutes <= 0;
  const [secondsRemaining, setSecondsRemaining] = useState(
    isUnlimited ? 0 : initialMinutes * 60
  );

  useEffect(() => {
    if (isUnlimited || isPaused) return;

    if (secondsRemaining <= 0) {
      if (onTimeExpired) onTimeExpired();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onTimeExpired, isPaused, isUnlimited]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = isUnlimited
    ? 'Livre'
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentDisplay = (currentIndex ?? 0) + 1;
  const progressPercent = totalItems && totalItems > 0
    ? Math.min(100, Math.round((currentDisplay / totalItems) * 100))
    : 0;

  return (
    <header className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
      <div className="flex items-center space-x-3">
        <span className="text-xl font-bold text-green-400 font-mono tracking-wider">
          NetDrill
        </span>
        <span className="text-xs bg-gray-800 text-gray-300 font-mono px-2 py-0.5 rounded">
          {topicTitle}
        </span>
      </div>

      <div className="flex items-center space-x-3">
        {/* Queue Progress Indicator */}
        {totalItems !== undefined && totalItems > 0 && (
          <div className="text-xs bg-[#12151e] border border-gray-800 px-2.5 py-1.5 rounded text-gray-400 font-mono hidden sm:flex items-center gap-2">
            <span>Fila:</span>
            <span className="text-white font-bold">{currentDisplay} / {totalItems}</span>
            <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <Link
          href="/"
          title="Alterar seleção de tópicos"
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2.5 py-1.5 rounded transition flex items-center gap-1 font-mono"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mudar Tópicos</span>
        </Link>

        {/* Timer Container */}
        <div
          className={`flex items-center space-x-1.5 font-mono px-3 py-1 rounded-md text-sm font-semibold border ${
            isPaused
              ? 'text-amber-400 bg-amber-950/60 border-amber-700 animate-pulse'
              : 'text-amber-400 bg-amber-400/10 border-amber-900/40'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{formattedTime}</span>
          {isPaused && <span className="text-[10px] ml-1 uppercase">[PAUSADO]</span>}
        </div>

        {/* Pause/Resume Button */}
        {!isUnlimited && onTogglePause && (
          <button
            type="button"
            onClick={onTogglePause}
            title={isPaused ? 'Retomar timer (P)' : 'Pausar timer (P)'}
            className={`p-1.5 rounded transition border text-xs flex items-center gap-1 font-mono cursor-pointer ${
              isPaused
                ? 'bg-green-950/80 border-green-700 text-green-300 hover:bg-green-900'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isPaused ? 'Retomar' : 'Pausar'}</span>
            <kbd className="text-[9px] bg-black/40 px-1 py-0.5 rounded text-gray-400">P</kbd>
          </button>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Encerrar sessão"
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-800 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
