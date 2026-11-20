'use client';

import React from 'react';
import { Lock, CornerDownLeft } from 'lucide-react';

interface MobileKeyboardBarProps {
  /** Callback to append special terminal character into the current input. */
  onInsertChar: (char: string) => void;
  /** Callback to trigger advance to the blind recall test (:done). */
  onDoneTrigger: () => void;
  /** Callback to validate the current command or configuration block (Enter). */
  onSubmit: () => void;
  /** Whether the session is currently in blind recall test mode. */
  isBlindTest?: boolean;
  /** Optional callback to exit blind recall test mode and restore reference. */
  onExitBlindTest?: () => void;
  /** Optional callback to open the floating man modal. */
  onOpenMan?: () => void;
  /** True in typing mode: rendered as the last row of a viewport-pinned column instead of sticky. */
  docked?: boolean;
}

/** Terminal symbols that are hard to reach on mobile virtual keyboards, with their accessible names. */
const SYMBOL_KEYS: ReadonlyArray<{ label: string; insert: string; aria: string }> = [
  { label: '-', insert: '-', aria: 'Hífen' },
  { label: '_', insert: '_', aria: 'Sublinhado' },
  { label: '/', insert: '/', aria: 'Barra' },
  { label: '|', insert: '|', aria: 'Pipe' },
  { label: '"', insert: '"', aria: 'Aspas' },
  { label: '$', insert: '$', aria: 'Cifrão' },
  { label: ':', insert: ':', aria: 'Dois-pontos' },
  { label: '>', insert: '>', aria: 'Redirecionamento' },
  { label: '⇥', insert: '    ', aria: 'Tabulação' },
];

/**
 * Mobile accessory dock rendered directly above the virtual keyboard (hidden on desktop).
 * Row 1 scrolls horizontally with terminal symbols and the man shortcut; row 2 holds the
 * two primary actions (blind test or reveal reference, and validate). All targets are >= 44px.
 */
export function MobileKeyboardBar({
  onInsertChar,
  onDoneTrigger,
  onSubmit,
  isBlindTest = false,
  onExitBlindTest,
  onOpenMan,
  docked = false,
}: MobileKeyboardBarProps) {
  // Prevent buttons from taking focus so the command field (and the virtual keyboard) stays active
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();
  const showSecondary = !isBlindTest || Boolean(onExitBlindTest);

  return (
    <div className={`lg:hidden ${docked ? 'shrink-0 pb-2' : 'sticky bottom-0 pb-safe'} z-30 -mx-4 md:-mx-6 border-t border-[#262b3d] bg-[#11141c] px-2.5 pt-2 space-y-2 font-sans`}>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none" aria-label="Símbolos do terminal">
        {SYMBOL_KEYS.map((k) => (
          <button
            key={k.aria}
            type="button"
            aria-label={k.aria}
            onMouseDown={keepFocus}
            onClick={() => onInsertChar(k.insert)}
            className="min-w-[44px] min-h-[44px] shrink-0 px-2.5 rounded-lg border border-[#262b3d] bg-[#1a1e29] active:bg-[#283144] text-slate-100 font-mono text-base font-semibold select-none"
          >
            {k.label}
          </button>
        ))}
        {onOpenMan && (
          <button
            type="button"
            onMouseDown={keepFocus}
            onClick={onOpenMan}
            className="min-h-[44px] shrink-0 px-3 rounded-lg border border-cyan-900 bg-[#0b1a22] active:bg-cyan-950 text-sky-300 font-mono text-sm font-semibold"
          >
            man
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {showSecondary &&
          (!isBlindTest ? (
            <button
              type="button"
              onMouseDown={keepFocus}
            onClick={onDoneTrigger}
              className="col-span-2 min-h-[48px] rounded-xl border border-amber-800 text-amber-400 active:bg-amber-950/40 text-sm font-semibold flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>Teste cego</span>
            </button>
          ) : (
            <button
              type="button"
              onMouseDown={keepFocus}
            onClick={onExitBlindTest}
              className="col-span-2 min-h-[48px] rounded-xl border border-slate-700 text-slate-300 active:bg-slate-800 text-sm font-semibold"
            >
              <span>Ver gabarito</span>
            </button>
          ))}
        <button
          type="button"
          onMouseDown={keepFocus}
            onClick={onSubmit}
          className={`${showSecondary ? 'col-span-3' : 'col-span-5'} min-h-[48px] rounded-xl bg-green-500 active:bg-green-600 text-green-950 text-[15px] font-bold flex items-center justify-center gap-2`}
        >
          <span>{isBlindTest ? 'Validar bloco' : 'Validar'}</span>
          <CornerDownLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
