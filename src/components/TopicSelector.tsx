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
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

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
    window.location.href = `/?topics=${encodeURIComponent(slugs)}&duration=${durationMinutes}`;
  }, [selectedSlugs, durationMinutes]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutBlocked(e.key, e.target)) return;

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
  const allSelected = selectedSlugs.size === topics.length;
  const totalDue = topics.reduce((sum, t) => sum + t.dueCount, 0);
  const durationOptions: ReadonlyArray<{ value: number; label: string }> = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 0, label: 'Free' },
  ];

  return (
    <div className="min-h-screen bg-[#0c0e14] text-[#e2e8f0] flex flex-col lg:justify-between lg:p-8 font-sans lg:font-mono">
      {/* Header */}
      <header className="h-14 lg:h-auto flex justify-between items-center border-b border-[#1d2230] lg:border-gray-800 pl-5 pr-2 lg:px-0 lg:pb-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <span className="text-green-400 font-bold text-[17px] lg:text-xl tracking-wider font-mono">NetDrill</span>
          <span className="hidden lg:inline text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded font-mono">Study dashboard</span>
        </div>
        <div className="flex items-center lg:space-x-4">
          <Link
            href="/import"
            aria-label="Import content"
            className="min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 justify-center text-xs text-slate-400 hover:text-white lg:border lg:border-gray-700 lg:hover:border-gray-500 lg:px-3 lg:py-1.5 rounded transition flex items-center gap-1 font-mono"
          >
            <PlusCircle className="w-5 h-5 lg:w-3.5 lg:h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Import content</span>
            <kbd className="hidden lg:inline text-[10px] bg-gray-800 px-1 rounded ml-1 text-gray-300">I</kbd>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out"
            className="min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 justify-center text-xs text-slate-400 lg:text-red-400 hover:text-red-300 transition flex items-center gap-1 font-mono"
          >
            <LogOut className="w-5 h-5 lg:w-3.5 lg:h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 lg:flex-none lg:my-auto max-w-5xl mx-auto w-full px-5 pt-6 pb-6 lg:px-0 lg:py-8 space-y-7 lg:space-y-6">
        <div className="space-y-1.5 lg:space-y-1">
          <div className="hidden lg:block text-xs uppercase tracking-wider text-green-400 font-bold font-mono">Session setup</div>
          <h1 className="text-[26px] lg:text-2xl font-bold text-white tracking-tight lg:font-mono">
            <span className="lg:hidden">Today&rsquo;s session</span>
            <span className="hidden lg:inline">Choose topics to practice</span>
          </h1>
          <p className="text-sm lg:text-xs text-slate-400 lg:font-mono">
            <span className="lg:hidden">{totalDue} {totalDue === 1 ? 'review due' : 'reviews due'}</span>
            <span className="hidden lg:inline">
              Use the keyboard (<kbd className="hidden lg:inline bg-gray-800 px-1 py-0.5 rounded text-gray-300">1</kbd>,{' '}
              <kbd className="hidden lg:inline bg-gray-800 px-1 py-0.5 rounded text-gray-300">2</kbd>,{' '}
              <kbd className="hidden lg:inline bg-gray-800 px-1 py-0.5 rounded text-gray-300">3</kbd>) or select the cards to toggle topics.
            </span>
          </p>
        </div>

        {/* Duration */}
        <section className="space-y-2.5 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-3 lg:border-y lg:border-gray-800/80 lg:py-3 text-xs">
          <h2 className="text-[13px] lg:text-xs font-semibold text-slate-400 uppercase lg:normal-case tracking-wider lg:tracking-normal lg:font-normal">
            Duration
          </h2>
          <div className="flex items-center gap-2">
            <div
              role="radiogroup"
              aria-label="Session duration"
              className="grid grid-cols-4 flex-1 gap-1 p-1 rounded-xl bg-[#161922] border border-[#262b3d] lg:flex lg:flex-none"
            >
              {durationOptions.map((opt) => {
                const checked = durationMinutes === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setDurationMinutes(opt.value)}
                    className={`min-h-[44px] lg:min-h-[32px] lg:px-3 rounded-lg text-sm lg:text-xs transition ${
                      checked ? 'bg-green-500 text-green-950 font-bold' : 'text-slate-300 font-medium hover:bg-gray-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Custom minutes (desktop only) */}
            <div className="hidden lg:flex items-center gap-1 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded focus-within:border-green-600">
              <input
                type="number"
                min={1}
                max={180}
                aria-label="Custom duration in minutes"
                value={durationMinutes > 0 ? durationMinutes : ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setDurationMinutes(isNaN(val) ? 0 : Math.max(1, Math.min(180, val)));
                }}
                placeholder="15"
                className="w-14 bg-transparent text-white outline-none text-right font-mono"
              />
              <span className="text-gray-500 text-xs">min</span>
            </div>
          </div>
        </section>

        {/* Topics */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider">Topics</h2>
            <button
              type="button"
              onClick={allSelected ? clearAll : selectAll}
              className="min-h-[44px] px-1 text-sm lg:text-xs font-semibold text-green-400 hover:text-green-300"
            >
              {allSelected ? 'Clear selection' : 'Select all'}
              <kbd className="hidden lg:inline text-[10px] bg-gray-800 text-gray-300 px-1 rounded ml-1.5">A</kbd>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
            {topics.map((topic, index) => {
              const isSelected = selectedSlugs.has(topic.slug);
              const hotkey = index < 9 ? String(index + 1) : null;

              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleTopic(topic.slug)}
                  className={`w-full min-h-[76px] text-left flex items-start gap-3.5 px-4 py-3.5 lg:p-5 rounded-xl border transition select-none ${
                    isSelected
                      ? 'bg-[#121a16] border-green-800 lg:border-green-500 hover:bg-[#15201a]'
                      : 'bg-[#12141c] border-[#262b3d] hover:bg-[#161922]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 w-[22px] h-[22px] shrink-0 rounded-md flex items-center justify-center border-[1.5px] ${
                      isSelected ? 'bg-green-500 border-green-500' : 'border-gray-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0c0e14]" strokeWidth={3.5} />}
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`text-base font-semibold lg:font-bold ${isSelected ? 'text-slate-100' : 'text-slate-300'}`}>
                        {topic.title}
                      </span>
                      {hotkey && <kbd className="hidden lg:inline text-[10px] bg-gray-800 text-gray-300 px-1.5 rounded font-mono">{hotkey}</kbd>}
                    </span>
                    {topic.description && (
                      <span className="text-[13px] lg:text-xs text-slate-400 truncate lg:whitespace-normal lg:line-clamp-2">{topic.description}</span>
                    )}
                    <span className="flex gap-3 pt-0.5 text-xs font-mono">
                      <span className="text-slate-400">{topic.itemCount} {topic.itemCount === 1 ? 'drill' : 'drills'}</span>
                      {topic.dueCount > 0 ? (
                        <span className="text-amber-400">
                          {topic.dueCount} {topic.dueCount === 1 ? 'review' : 'reviews'}
                        </span>
                      ) : (
                        <span className="text-green-400">Up to date</span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Start action: sticky on mobile, inline on desktop */}
      <div className="sticky bottom-0 z-20 lg:static border-t border-[#1d2230] lg:border-0 bg-[#0c0e14] px-5 pt-3 pb-safe lg:p-0 lg:pb-4 max-w-5xl mx-auto w-full flex flex-col lg:flex-row items-stretch lg:items-center lg:justify-between gap-2.5 lg:gap-4">
        <p className="text-[13px] lg:text-xs text-slate-400 font-mono text-center lg:text-left">
          {formatSelectionSummary(selectedSlugs.size, totalSelectedItems, durationMinutes)}
        </p>
        <Button
          onClick={handleStart}
          disabled={selectedSlugs.size === 0}
          className="w-full lg:w-auto min-h-[54px] lg:min-h-0 rounded-xl lg:rounded-md bg-green-500 hover:bg-green-400 text-green-950 px-8 py-3 text-base lg:text-sm font-bold flex items-center justify-center gap-2"
        >
          <span>Start session</span>
          <ArrowRight className="w-[18px] h-[18px] lg:w-4 lg:h-4" aria-hidden="true" />
          <kbd className="hidden lg:inline bg-green-700/60 text-black px-1.5 py-0.5 rounded text-xs font-mono font-normal">Enter ↵</kbd>
        </Button>
      </div>

      {/* Footer (desktop only: keyboard shortcuts) */}
      <footer className="hidden lg:flex border-t border-gray-800 pt-4 max-w-5xl mx-auto w-full text-xs text-gray-500 flex-wrap justify-between items-center gap-2 font-mono">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="hidden lg:inline bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">1-{topics.length}</kbd> Toggle topic
          </span>
          <span>
            <kbd className="hidden lg:inline bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">A</kbd> Select all
          </span>
          <span>
            <kbd className="hidden lg:inline bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded">Enter</kbd> Start
          </span>
        </div>
        <div>NetDrill &bull; Spaced repetition &amp; muscle memory</div>
      </footer>
    </div>
  );
}

/**
 * Builds the selection summary shown above the start action.
 *
 * @param topicCount - Number of selected topics.
 * @param exerciseCount - Total exercises across the selected topics.
 * @param minutes - Session duration in minutes (0 means no time limit).
 * @returns A summary such as "2 topics · 20 drills · 15 min", or a prompt when nothing is selected.
 */
export function formatSelectionSummary(topicCount: number, exerciseCount: number, minutes: number): string {
  if (topicCount === 0) return 'Select at least one topic';
  const topicsLabel = `${topicCount} ${topicCount === 1 ? 'topic' : 'topics'}`;
  const exercisesLabel = `${exerciseCount} ${exerciseCount === 1 ? 'drill' : 'drills'}`;
  const durationLabel = minutes > 0 ? `${minutes} min` : 'no limit';
  return `${topicsLabel} · ${exercisesLabel} · ${durationLabel}`;
}

/**
 * Decides whether a global lobby shortcut must be ignored for the event target.
 * Typing fields swallow every shortcut; a focused button keeps Enter for its own activation.
 *
 * @param key - The pressed key (KeyboardEvent.key).
 * @param target - The event target.
 * @returns True when the shortcut must not run.
 */
export function isShortcutBlocked(key: string, target: EventTarget | null): boolean {
  const tag = (target as { tagName?: string } | null)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return key === 'Enter' && tag === 'BUTTON';
}
