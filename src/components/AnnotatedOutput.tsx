'use client';

import React, { useEffect, useState } from 'react';
import { WrapText } from 'lucide-react';
import { OutputSegment } from '@/lib/telemetry-glossary';

/** localStorage key that remembers the viewer's line-wrap preference across exercises. */
const WRAP_STORAGE_KEY = 'netdrill_stdout_wrap';

interface AnnotatedOutputProps {
  /** Command whose output is displayed, shown in the box header. */
  command: string;
  /** Parsed output segments; segments with a metricKey are rendered as tappable tokens. */
  segments: OutputSegment[];
  /** Metric key currently inspected, or null. */
  selectedKey: string | null;
  /** Called with the metric key of the tapped token. */
  onSelect: (metricKey: string) => void;
}

/**
 * Raw terminal output with interactive telemetry tokens.
 * Keeps terminal columns (horizontal scroll) by default; an optional toggle wraps long lines,
 * and the box grows with its content instead of being squeezed by a scrolling flex parent.
 */
export function AnnotatedOutput({ command, segments, selectedKey, onSelect }: AnnotatedOutputProps) {
  const [wrap, setWrap] = useState(false);

  useEffect(() => {
    try {
      setWrap(localStorage.getItem(WRAP_STORAGE_KEY) === '1');
    } catch {
      // Storage unavailable (private mode): keep the default
    }
  }, []);

  const toggleWrap = () => {
    setWrap((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(WRAP_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Storage unavailable: the preference lasts for this page only
      }
      return next;
    });
  };

  return (
    <section className="shrink-0 bg-[#05070a] border border-gray-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 pl-3 border-b border-gray-800">
        <code className="text-cyan-300 font-bold text-[13px] truncate">$ {command}</code>
        <button
          type="button"
          aria-pressed={wrap}
          onClick={toggleWrap}
          className={`min-h-[44px] shrink-0 px-3 flex items-center gap-1.5 text-xs font-semibold font-sans transition ${
            wrap ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <WrapText className="w-4 h-4" aria-hidden="true" />
          <span>Quebrar linhas</span>
        </button>
      </div>

      <div
        data-output="raw"
        className={`px-3 py-2 text-[12.5px] leading-normal font-mono text-gray-300 ${
          wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto'
        }`}
      >
        {segments.map((seg, idx) => {
          if (!seg.metricKey) return <span key={idx}>{seg.text}</span>;
          const key = seg.metricKey;
          const isSelected = selectedKey === key;
          return (
            <button
              key={idx}
              type="button"
              data-metric={key}
              aria-pressed={isSelected}
              onClick={() => onSelect(key)}
              className={`inline px-[3px] rounded-[3px] font-bold align-baseline cursor-pointer transition ${
                isSelected
                  ? 'bg-cyan-400 text-black'
                  : seg.isAlert
                  ? 'bg-red-950/80 text-red-300 underline decoration-dotted shadow-[inset_0_0_0_1px_rgba(185,28,28,0.8)]'
                  : 'bg-cyan-950/80 text-cyan-300 underline decoration-dotted shadow-[inset_0_0_0_1px_rgba(14,116,144,0.8)]'
              }`}
            >
              {seg.text}
            </button>
          );
        })}
      </div>
    </section>
  );
}
