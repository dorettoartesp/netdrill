'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, LogOut, LayoutGrid } from 'lucide-react';

interface TimerHeaderProps {
  initialMinutes?: number;
  onTimeExpired?: () => void;
  topicTitle?: string;
  onLogout?: () => void;
}

/**
 * Top application header containing the brand identifier, topic breadcrumb,
 * and session countdown timer.
 */
export function TimerHeader({
  initialMinutes = 15,
  onTimeExpired,
  topicTitle = 'Treino Ativo',
  onLogout,
}: TimerHeaderProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      if (onTimeExpired) onTimeExpired();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onTimeExpired]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

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
        <Link
          href="/"
          title="Alterar seleção de tópicos"
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2.5 py-1.5 rounded transition flex items-center gap-1 font-mono"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mudar Tópicos</span>
        </Link>

        <div className="flex items-center space-x-1.5 font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-md text-sm font-semibold">
          <Clock className="w-4 h-4" />
          <span>{formattedTime}</span>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Encerrar sessão"
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
