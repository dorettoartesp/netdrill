'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, Search, X } from 'lucide-react';
import type { DocumentEntry, DocumentSummary } from '@/lib/content/catalog';
import { ManualEntryView } from './manual/ManualEntryView';

interface ManModalProps {
  /** Whether the modal is visible. */
  isOpen: boolean;
  /** Command name searched when the modal opens (e.g. the drill's base command). */
  initialCommand?: string;
  /** Closes the modal. */
  onClose: () => void;
}

type ModalState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'entry'; entry: DocumentEntry }
  | { status: 'choose'; matches: DocumentSummary[] }
  | { status: 'empty' }
  | { status: 'error' };

/**
 * Floating manual reader over the study session. Searches uploaded commands by name:
 * one match opens it, several show a chooser, none offers the external man7.org search.
 */
export function ManModal({ isOpen, initialCommand = '', onClose }: ManModalProps) {
  const [query, setQuery] = useState(initialCommand);
  const [state, setState] = useState<ModalState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const openEntry = useCallback(async (id: string, signal: AbortSignal) => {
    const res = await fetch(`/api/man/${encodeURIComponent(id)}`, { signal });
    if (!res.ok) throw new Error(String(res.status));
    setState({ status: 'entry', entry: await res.json() });
  }, []);

  const search = useCallback(
    async (raw: string) => {
      const q = raw.trim();
      if (!q) {
        setState({ status: 'idle' });
        return;
      }
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ status: 'loading' });
      try {
        const res = await fetch(`/api/man?kind=command&q=${encodeURIComponent(q)}`, { signal: controller.signal });
        if (!res.ok) throw new Error(String(res.status));
        const list: DocumentSummary[] = await res.json();
        const exact = list.filter((d) => d.name.toLowerCase() === q.toLowerCase());
        const candidates = exact.length ? exact : list;
        if (candidates.length === 1) await openEntry(candidates[0].id, controller.signal);
        else if (candidates.length > 1) setState({ status: 'choose', matches: candidates });
        else setState({ status: 'empty' });
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setState({ status: 'error' });
      }
    },
    [openEntry]
  );

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialCommand);
    search(initialCommand);
    return () => abortRef.current?.abort();
  }, [isOpen, initialCommand, search]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLInputElement;
      if (e.key === 'Escape' || (e.key === 'q' && !typing)) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const man7Url = `https://www.google.com/search?q=${encodeURIComponent(`${query.trim() || 'linux'} site:man7.org/linux/man-pages`)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="man-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 font-sans text-slate-200 sm:items-center sm:p-5"
    >
      <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-t-2xl border border-[#262b3d] bg-[#0c0e14] shadow-2xl sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-[#1d2230] p-2 pl-3">
          <h2 id="man-modal-title" className="sr-only">Manual</h2>
          <form
            className="flex min-w-0 flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              search(query);
            }}
          >
            <span className="font-mono font-bold text-sky-400" aria-hidden="true">$ man</span>
            <label htmlFor="man-modal-query" className="sr-only">Command name</label>
            <input
              id="man-modal-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-[#262b3d] bg-[#05070a] px-2.5 py-2 font-mono text-slate-100 outline-none focus:border-sky-600"
            />
            <button
              type="submit"
              disabled={state.status === 'loading'}
              aria-label="Search"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-sky-400 hover:bg-sky-950/40 disabled:opacity-50"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close manual"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4" aria-live="polite">
          {state.status === 'loading' && <p className="py-10 text-center text-sm text-slate-400">Loading…</p>}
          {state.status === 'entry' && <ManualEntryView entry={state.entry} />}
          {state.status === 'choose' && (
            <div className="space-y-2">
              <p className="m-0 text-sm text-slate-400">Several commands match. Choose one:</p>
              {state.matches.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    const controller = new AbortController();
                    abortRef.current = controller;
                    setState({ status: 'loading' });
                    openEntry(d.id, controller.signal).catch(() => setState({ status: 'error' }));
                  }}
                  className="flex w-full min-h-[48px] items-center justify-between gap-2 rounded-xl border border-[#262b3d] bg-[#12141c] px-3.5 text-left hover:border-green-800"
                >
                  <span className="font-mono font-bold text-slate-100">{d.name}</span>
                  <span className="text-xs text-slate-400">{d.topicSlug}</span>
                </button>
              ))}
            </div>
          )}
          {(state.status === 'empty' || state.status === 'idle') && (
            <div className="space-y-3 py-10 text-center text-sm text-slate-400">
              <p className="m-0">{state.status === 'empty' ? 'No manual entry found for this command.' : 'Type a command name.'}</p>
              {state.status === 'empty' && (
                <a href={man7Url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300">
                  Search man7.org <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
          {state.status === 'error' && (
            <p className="py-10 text-center text-sm text-red-300">The manual could not be loaded. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
