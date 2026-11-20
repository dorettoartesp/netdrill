import React from 'react';
import type { UseCase } from '@/lib/content/schema';

const SEVERITY: Record<UseCase['severity'], { label: string; border: string; badge: string }> = {
  critical: { label: 'Critical', border: 'border-red-800/60', badge: 'bg-red-950/80 border-red-800 text-red-300' },
  incident: { label: 'Incident', border: 'border-amber-800/60', badge: 'bg-amber-950/80 border-amber-800 text-amber-300' },
  routine: { label: 'Routine', border: 'border-cyan-900/60', badge: 'bg-cyan-950/80 border-cyan-800 text-cyan-300' },
};

interface UseCaseListProps {
  /** Use cases recorded for the drill's command or procedure. */
  useCases: UseCase[];
  /** Command (or command sequence) being studied, shown under each case. */
  target: string;
}

/**
 * Lists the production use cases of the drill being studied, or an explicit empty state
 * when the uploaded content has none (no fabricated examples).
 */
export function UseCaseList({ useCases, target }: UseCaseListProps) {
  if (useCases.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-gray-400 font-sans">No use cases recorded for this command.</p>
    );
  }

  return (
    <div className="space-y-3">
      {useCases.map((uc, idx) => {
        const sev = SEVERITY[uc.severity];
        return (
          <div key={idx} className={`bg-[#0f121a] border ${sev.border} rounded-lg p-3 lg:p-4 space-y-2`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-white font-bold text-sm">{uc.title}</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${sev.badge}`}>{sev.label}</span>
            </div>
            <p className="text-[13px] lg:text-xs font-sans lg:font-mono text-gray-300 leading-relaxed">{uc.situation}</p>
            <div className="bg-[#07090e] border border-gray-800 rounded p-2 text-xs font-mono text-emerald-300">
              <code className="whitespace-pre-wrap break-all">$ {target}</code>
            </div>
          </div>
        );
      })}
    </div>
  );
}
