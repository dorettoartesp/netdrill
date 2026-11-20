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
}

/**
 * Mobile-optimized accessory action dock placed directly above or below the terminal.
 * Features large >= 48px touch targets for Enter validation, :done mode, and terminal symbols.
 */
export function MobileKeyboardBar({
  onInsertChar,
  onDoneTrigger,
  onSubmit,
  onClear,
  isBlindTest = false,
}: MobileKeyboardBarProps) {
  const keys = ['-', '_', '/', '|', '"', '$', ':', 'Tab'];

  return (
    <div className="lg:hidden sticky bottom-0 z-30 w-full border-t border-gray-800 bg-[#161922]/95 backdrop-blur-md pt-2 pb-safe px-3 shadow-2xl space-y-2 font-mono">
      {/* Row 1: Horizontal scroll of frequent CLI characters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onInsertChar(k === 'Tab' ? '    ' : k)}
            className="min-w-[44px] min-h-[44px] px-2.5 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white font-mono font-bold rounded-lg text-sm select-none transition shadow"
          >
            {k}
          </button>
        ))}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="min-w-[44px] min-h-[44px] px-3 bg-gray-900 hover:bg-gray-800 active:bg-gray-700 text-gray-400 hover:text-white font-mono text-xs rounded-lg transition"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Row 2: Dedicated tactile buttons for Enter/Validar and :done */}
      <div className="grid grid-cols-2 gap-2">
        {!isBlindTest && (
          <button
            type="button"
            onClick={onDoneTrigger}
            className="min-h-[48px] px-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-mono font-bold rounded-lg transition text-xs flex items-center justify-center gap-1.5 shadow active:scale-[0.98]"
          >
            <span>:done (Teste Cego)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onSubmit}
          className={`min-h-[48px] px-4 font-mono font-bold rounded-lg transition text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
            isBlindTest
              ? 'col-span-2 bg-green-500 hover:bg-green-400 text-black text-base'
              : 'bg-green-600 hover:bg-green-500 text-black'
          }`}
        >
          <span>{isBlindTest ? 'Validar de Memória' : 'Validar'}</span>
          <span className="text-xs font-normal bg-black/20 px-1.5 py-0.5 rounded">
            ↵ Enter
          </span>
        </button>
      </div>
    </div>
  );
}
