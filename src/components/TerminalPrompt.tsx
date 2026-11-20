'use client';

import React, { useRef, useEffect } from 'react';
import { isExitCommand } from '@/lib/validator';

interface TerminalPromptProps {
  isMultiLine: boolean;
  target: string;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onExitTrigger: () => void;
  isBlindTest?: boolean;
  repetitionCount?: number;
}

/**
 * Terminal prompt component supporting single-line commands and multi-line snippets.
 * Ensures the typing textarea exactly matches the reference snippet height.
 */
export function TerminalPrompt({
  isMultiLine,
  target,
  value,
  onChange,
  onSubmit,
  onExitTrigger,
  isBlindTest = false,
  repetitionCount = 1,
}: TerminalPromptProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isMultiLine && textareaRef.current) {
      textareaRef.current.focus();
    } else if (!isMultiLine && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMultiLine, isBlindTest]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onExitTrigger();
      return;
    }

    if (e.key === 'Enter' && !isMultiLine) {
      e.preventDefault();
      if (isExitCommand(value)) {
        onExitTrigger();
      } else {
        onSubmit();
      }
    }
  };

  const lineCount = target.split('\n').length;
  const minHeightPx = Math.max(260, lineCount * 24 + 40);

  if (isMultiLine) {
    return (
      <div className="w-full space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Reference Snippet Box (Hidden during Blind Test) */}
          <div
            style={{ minHeight: `${minHeightPx}px` }}
            className={`rounded-lg border p-4 flex flex-col font-mono text-sm leading-relaxed transition-all ${
              isBlindTest
                ? 'bg-[#12141c] border-dashed border-gray-800 text-gray-600 justify-center items-center text-center'
                : 'bg-[#12141c] border-gray-800 text-green-300'
            }`}
          >
            {isBlindTest ? (
              <div className="space-y-2">
                <span className="text-amber-400 font-bold block text-base">
                  MODO TESTE CEGO
                </span>
                <p className="text-xs text-gray-400">
                  O gabarito foi ocultado. Digite o código completo de memória.
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-2 border-b border-gray-800 pb-2">
                  <span>GABARITO DE REFERÊNCIA ({lineCount} linhas)</span>
                </div>
                <pre className="flex-1 whitespace-pre overflow-x-auto text-green-300">
                  {target}
                </pre>
              </>
            )}
          </div>

          {/* User Typing Textarea (Matching Height Exactly) */}
          <div
            style={{ minHeight: `${minHeightPx}px` }}
            className="rounded-lg border border-green-500/40 bg-black p-4 flex flex-col font-mono text-sm leading-relaxed shadow-lg"
          >
            <div className="flex justify-between items-center text-xs text-gray-400 mb-2 border-b border-gray-800 pb-2">
              <span className="text-amber-400 font-semibold">
                {isBlindTest ? 'Teste de Memória' : `[Tentativa #${repetitionCount}] Digite o código`}
              </span>
              <span className="text-gray-500">Ctrl+Enter para teste cego</span>
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite o código acima..."
              className="flex-1 w-full bg-transparent border-none outline-none resize-none text-green-300 font-mono text-sm leading-relaxed focus:ring-0 p-0"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400 pt-1">
          <span>
            Pressione <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">Ctrl+Enter</kbd> ou digite <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">:done</kbd> para avançar ao teste cego.
          </span>
          <button
            type="button"
            onClick={onSubmit}
            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-4 py-2 rounded text-xs transition"
          >
            Validar Bloco
          </button>
        </div>
      </div>
    );
  }

  // Single line command layout
  return (
    <div className="w-full space-y-4">
      {!isBlindTest && (
        <div className="bg-[#12141c] border border-gray-800 rounded-lg p-4 font-mono text-sm text-green-300">
          <div className="text-xs text-gray-500 mb-1">Gabarito de Referência:</div>
          <div>{target}</div>
        </div>
      )}

      <div className="bg-black border border-green-500/40 rounded-lg p-4 font-mono shadow-lg">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span className="text-amber-400 font-semibold">
            {isBlindTest ? 'Teste de Memória (Sem gabarito)' : `[Tentativa #${repetitionCount}] Digite o comando`}
          </span>
          <span className="text-gray-500">Pressione Enter</span>
        </div>

        <div className="flex items-center text-green-300 text-base">
          <span className="mr-2 text-green-500 font-bold">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBlindTest ? 'Digite o comando de memória...' : target}
            className="w-full bg-transparent border-none outline-none text-green-300 focus:ring-0 text-sm font-mono p-0"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
