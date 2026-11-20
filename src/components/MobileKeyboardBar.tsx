'use client';

import React from 'react';

interface MobileKeyboardBarProps {
  onInsertChar: (char: string) => void;
  onDoneTrigger: () => void;
}

/**
 * Mobile-optimized accessory bar placed directly above the virtual keyboard.
 * Provides rapid insertion of terminal syntax characters with >= 44px touch targets.
 */
export function MobileKeyboardBar({
  onInsertChar,
  onDoneTrigger,
}: MobileKeyboardBarProps) {
  const keys = ['-', '_', '/', '|', 'Tab'];

  return (
    <div className="lg:hidden w-full border-t border-gray-800 bg-[#161922] py-2 px-3">
      <div className="flex justify-center items-center gap-2 overflow-x-auto">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onInsertChar(k === 'Tab' ? '    ' : k)}
            className="min-w-[44px] min-h-[44px] px-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white font-mono font-bold rounded-lg transition"
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          onClick={onDoneTrigger}
          className="min-h-[44px] px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-mono font-bold rounded-lg transition text-xs uppercase tracking-wider"
        >
          :done
        </button>
      </div>
    </div>
  );
}
