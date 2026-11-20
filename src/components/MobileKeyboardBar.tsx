'use client';

import React from 'react';

interface MobileKeyboardBarProps {
  /** Callback to append special terminal character into the current input. */
  onInsertChar: (char: string) => void;
  /** Callback to trigger advance to the blind recall test (:done). */
  onDoneTrigger: () => void;
  /** Callback to validate the current command or configuration block (Enter). */
  onSubmit: () => void;
  /** Optional callback to clear the input field. */
  onClear?: () => void;
  /** Whether the session is currently in blind recall test mode. */
  isBlindTest?: boolean;
  /** Optional callback to exit blind recall test mode and restore reference. */
  onExitBlindTest?: () => void;
  /** Optional callback to open the floating man modal. */
  onOpenMan?: () => void;
}

/**
 * Mobile-optimized accessory action dock placed directly above or below the terminal.
 * Features large >= 48px touch targets for Enter validation, :done mode, escape hatch, and terminal symbols.
 */
export function MobileKeyboardBar({
  onInsertChar,
  onDoneTrigger,
  onSubmit,
  onClear,
  isBlindTest = false,
  onExitBlindTest,
  onOpenMan,
}: MobileKeyboardBarProps) {
  const keys = ['-', '_', '/', '|', '"', '$', ':', 'Tab'];

  return (
    <div className="lg:hidden sticky bottom-0 z-30 w-full border-t border-gray-800 bg-[#0c0e14]/95 backdrop-blur-md pt-2 pb-safe px-3 shadow-2xl space-y-2 font-mono">
      {/* Row 1: Horizontal scroll of frequent CLI characters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onInsertChar(k === 'Tab' ? '    ' : k)}
            className="min-w-[44px] min-h-[44px] px-2.5 bg-[#12151e] hover:bg-[#1e2433] active:bg-[#283144] border border-gray-800 text-white font-mono font-bold rounded-lg text-sm select-none transition shadow"
          >
            {k}
          </button>
        ))}
        {onOpenMan && (
          <button
            type="button"
            onClick={onOpenMan}
            className="min-w-[44px] min-h-[44px] px-2.5 bg-[#12151e] hover:bg-cyan-950/40 active:bg-cyan-900/60 border border-cyan-800/80 text-cyan-300 font-mono text-xs font-bold rounded-lg transition shadow"
            title="Abrir Manual (man)"
          >
            📖 man
          </button>
        )}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="min-w-[44px] min-h-[44px] px-3 bg-[#12151e] hover:bg-red-950/40 active:bg-red-900/60 border border-gray-800 text-red-400 font-mono text-xs rounded-lg transition"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Row 2: Dedicated tactile buttons for Enter/Validar, :done, and Blind Test Escape Hatch */}
      <div className="grid grid-cols-2 gap-2">
        {!isBlindTest ? (
          <button
            type="button"
            onClick={onDoneTrigger}
            className="min-h-[48px] px-3 bg-[#12151e] active:bg-[#1a202c] border border-amber-600/80 text-amber-400 font-mono font-bold rounded-lg transition text-xs flex items-center justify-center gap-1.5 shadow active:scale-[0.98]"
          >
            <span>🔒 :done (Teste Cego)</span>
          </button>
        ) : onExitBlindTest ? (
          <button
            type="button"
            onClick={onExitBlindTest}
            className="min-h-[48px] px-2 bg-[#12151e] active:bg-[#1a202c] border border-gray-700 text-gray-300 font-mono font-bold rounded-lg transition text-xs flex items-center justify-center gap-1 shadow active:scale-[0.98]"
          >
            <span>[ Esc ] Ver Gabarito</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          className={`min-h-[48px] px-4 font-mono font-bold rounded-lg transition text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
            isBlindTest && !onExitBlindTest
              ? 'col-span-2 bg-green-500 hover:bg-green-400 text-black text-base'
              : 'bg-green-600 hover:bg-green-500 text-black'
          }`}
        >
          <span>{isBlindTest ? 'Validar Bloco' : 'Validar'}</span>
          <span className="text-xs font-normal bg-black/20 px-1.5 py-0.5 rounded">
            ↵ Enter
          </span>
        </button>
      </div>
    </div>
  );
}
