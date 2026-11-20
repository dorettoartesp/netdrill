'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronLeft, Clock, LogOut, LayoutGrid, Pause, Play } from 'lucide-react';

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
 * queue progress indicator (Queue: X / Y), session countdown timer with pause/resume support,
 * and topic navigation.
 */
export function TimerHeader({
  initialMinutes = 15,
  onTimeExpired,
  topicTitle = 'Active session',
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
    ? 'Free'
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentDisplay = (currentIndex ?? 0) + 1;
  const progressPercent = totalItems && totalItems > 0
    ? Math.min(100, Math.round((currentDisplay / totalItems) * 100))
    : 0;

  return (
    <>
      {/* Mobile header: back, topic + queue position, tappable timer (pause), logout; full-width progress */}
      <header className="lg:hidden -mx-4 md:-mx-6 border-b border-[#1d2230] font-sans">
        <div className="h-14 flex items-center justify-between px-1">
          <Link
            href="/"
            aria-label="Change topics"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </Link>

          <div className="min-w-0 flex-1 flex flex-col items-center px-2">
            <span className="max-w-full truncate text-xs text-slate-400">{topicTitle}</span>
            {totalItems !== undefined && totalItems > 0 && (
              <span className="font-mono text-sm font-semibold text-slate-100">{currentDisplay} of {totalItems}</span>
            )}
          </div>

          <div className="flex items-center">
            {!isUnlimited && onTogglePause ? (
              <button
                type="button"
                onClick={onTogglePause}
                aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
                className={`min-h-[44px] px-2.5 flex items-center gap-1.5 font-mono text-[15px] font-semibold ${
                  isPaused ? 'text-amber-400' : 'text-green-400'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> : <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />}
                <span>{formattedTime}</span>
              </button>
            ) : (
              <span className="px-2.5 font-mono text-[15px] font-semibold text-green-400">{formattedTime}</span>
            )}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                aria-label="Log out"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
              >
                <LogOut className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div className="h-[3px] bg-[#1d2230]" aria-hidden="true">
          <div className={`h-full transition-all duration-300 ${isPaused ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      {/* Desktop header */}
      <header className="hidden lg:flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
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
            <span>Queue:</span>
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
          title="Change topic selection"
          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2.5 py-1.5 rounded transition flex items-center gap-1 font-mono"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Change topics</span>
        </Link>

        <Link
          href="/man"
          title="Open the manual (man)"
          className="text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-800/80 hover:border-cyan-600 bg-cyan-950/30 px-2.5 py-1.5 rounded transition flex items-center gap-1 font-mono"
        >
          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Man</span>
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
          {isPaused && <span className="text-[10px] ml-1 uppercase">[PAUSED]</span>}
        </div>

        {/* Pause/Resume Button */}
        {!isUnlimited && onTogglePause && (
          <button
            type="button"
            onClick={onTogglePause}
            title={isPaused ? 'Resume timer (P)' : 'Pause timer (P)'}
            className={`p-1.5 rounded transition border text-xs flex items-center gap-1 font-mono cursor-pointer ${
              isPaused
                ? 'bg-green-950/80 border-green-700 text-green-300 hover:bg-green-900'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            <kbd className="text-[9px] bg-black/40 px-1 py-0.5 rounded text-gray-400">P</kbd>
          </button>
        )}

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Log out"
            className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-800 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
    </>
  );
}
