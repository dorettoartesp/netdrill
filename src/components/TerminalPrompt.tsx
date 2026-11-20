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
  onExitBlindTest?: () => void;
  isBlindTest?: boolean;
  repetitionCount?: number;
  onOpenMan?: (cmd: string) => void;
}

/**
 * Terminal prompt component supporting single-line commands and multi-line snippets.
 * Ensures 100% keyboard ergonomics: Ctrl+Enter submits multi-line, Tab indents 4 spaces,
 * and an escape hatch restores reference in blind test mode.
 */
export function TerminalPrompt({
  isMultiLine,
  target,
  value,
  onChange,
  onSubmit,
  onExitTrigger,
  onExitBlindTest,
  isBlindTest = false,
  repetitionCount = 1,
  onOpenMan,
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
    // Escape hatch from blind test
    if (e.key === 'Escape' && isBlindTest && onExitBlindTest) {
      e.preventDefault();
      onExitBlindTest();
      return;
    }

    // Multi-line keyboard controls
    if (isMultiLine) {
      // Ctrl+Shift+Enter -> Blind test trigger
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        onExitTrigger();
        return;
      }

      // Ctrl+Enter or Cmd+Enter -> Validate block immediately
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSubmit();
        return;
      }

      // Tab key -> Insert 4 spaces without losing focus
      if (e.key === 'Tab' && textareaRef.current) {
        e.preventDefault();
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const indent = '    ';
        const nextVal = value.substring(0, start) + indent + value.substring(end);
        onChange(nextVal);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + indent.length;
        });
        return;
      }
      return;
    }

    // Single-line keyboard controls
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed.startsWith(':man') && onOpenMan) {
        const cmd = trimmed.replace(/^:man\s*/, '') || target.split(' ')[0];
        onOpenMan(cmd);
        onChange('');
        return;
      }
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
      <div className="w-full space-y-4 font-mono">
        {/* Split view on desktop / stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Reference Snippet (Hidden or Replaced in Blind Test) */}
          <div
            style={{ minHeight: `${minHeightPx}px` }}
            className={`border rounded-lg p-4 flex flex-col justify-between transition-colors ${
              isBlindTest
                ? 'bg-[#0f111a] border-amber-500/40 border-dashed'
                : 'bg-[#12141c] border-gray-800'
            }`}
          >
            <div>
              <div className="flex justify-between items-center text-xs text-gray-400 mb-2 border-b border-gray-800/60 pb-2">
                <span>
                  {isBlindTest ? '// GABARITO OCULTO' : `// GABARITO DE REFERÊNCIA (${lineCount} linhas)`}
                </span>
                <span className={isBlindTest ? 'text-amber-400 font-bold' : 'text-green-400'}>
                  {isBlindTest ? 'Modo Teste Cego' : 'Sintaxe Exata'}
                </span>
              </div>

              {isBlindTest ? (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="text-amber-400 font-bold text-sm tracking-wider">
                    🔒 MODO TESTE CEGO ATIVO
                  </div>
                  <p className="text-xs text-gray-400">
                    O gabarito foi ocultado. Digite a configuração completa de memória.
                  </p>
                  {onExitBlindTest && (
                    <button
                      type="button"
                      onClick={onExitBlindTest}
                      className="text-xs bg-[#12151e] hover:bg-[#1a202c] border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded transition cursor-pointer"
                    >
                      [ Esc ] Desistir e Ver Gabarito
                    </button>
                  )}
                </div>
              ) : (
                <pre className="text-xs md:text-sm text-green-300 font-mono leading-relaxed overflow-x-auto whitespace-pre selection:bg-transparent">
                  {target}
                </pre>
              )}
            </div>

            <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-800/60 flex justify-between">
              <span>{isBlindTest ? 'Digite tudo sem consultar' : 'Treine a memória muscular'}</span>
              <span>Indente com 4 espaços (Tab)</span>
            </div>
          </div>

          {/* User Typing Textarea */}
          <div
            style={{ minHeight: `${minHeightPx}px` }}
            className="bg-black border border-green-500/40 rounded-lg p-4 flex flex-col justify-between shadow-lg focus-within:border-green-400 transition"
          >
            <div>
              <div className="flex justify-between items-center text-xs text-gray-400 mb-2 border-b border-gray-800/60 pb-2">
                <span className="text-amber-400 font-semibold">
                  {isBlindTest
                    ? 'Teste de Memória (Sem gabarito)'
                    : `[Tentativa #${repetitionCount}] Digite o código`}
                </span>
                <span className="text-gray-400 hidden sm:inline">
                  Validar: <kbd className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded border border-gray-700">Ctrl+↵</kbd>
                </span>
              </div>

              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isBlindTest
                    ? 'Digite o bloco completo de memória...'
                    : 'Digite o código ao lado linha a linha...'
                }
                rows={Math.max(8, lineCount)}
                className="w-full bg-transparent text-green-300 font-mono text-[16px] md:text-sm leading-relaxed border-none outline-none resize-none focus:ring-0 p-0 placeholder-gray-600"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-800/60 flex justify-between items-center">
              <span>Tab: 4 espaços</span>
              <span>Ctrl+↵ para validar</span>
            </div>
          </div>
        </div>

        {/* Action bar below split layout */}
        <div className="flex flex-wrap justify-between items-center text-xs text-gray-400 gap-2 pt-1">
          <div className="hidden sm:flex items-center gap-4">
            <span>
              <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200 border border-gray-700">Ctrl+↵</kbd> Validar Bloco
            </span>
            <span>
              <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200 border border-gray-700">Tab</kbd> Indentar
            </span>
            {!isBlindTest && (
              <span>
                <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200 border border-gray-700">Ctrl+Shift+↵</kbd> Teste Cego
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {!isBlindTest ? (
              <button
                type="button"
                onClick={onExitTrigger}
                className="text-amber-400 hover:text-amber-300 text-xs font-mono font-bold border border-amber-500/40 bg-amber-500/10 px-3 py-2 rounded transition flex items-center gap-1.5"
              >
                <span>🔒 Avançar (:done)</span>
              </button>
            ) : (
              onExitBlindTest && (
                <button
                  type="button"
                  onClick={onExitBlindTest}
                  className="text-xs bg-[#12151e] hover:bg-[#1a202c] border border-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded transition font-mono"
                >
                  [ Esc ] Desistir e Ver Gabarito
                </button>
              )
            )}
            <button
              type="button"
              onClick={onSubmit}
              className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-black font-bold px-5 py-2 rounded text-xs transition flex items-center justify-center gap-1.5 shadow active:scale-95"
            >
              <span>Validar Bloco</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-normal">Ctrl+↵</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Single line command layout
  return (
    <div className="w-full space-y-4 font-mono">
      {!isBlindTest && (
        <div className="bg-[#12141c] border border-gray-800 rounded-lg p-4 text-sm text-green-300">
          <div className="text-xs text-gray-500 mb-1">Gabarito de Referência:</div>
          <div>{target}</div>
        </div>
      )}

      <div className="bg-black border border-green-500/40 rounded-lg p-4 shadow-lg focus-within:border-green-400 transition">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span className="text-amber-400 font-semibold">
            {isBlindTest ? 'Teste de Memória (Sem gabarito)' : `[Tentativa #${repetitionCount}] Digite o comando`}
          </span>
          <span className="text-gray-400">Pressione Enter ou clique em Validar</span>
        </div>

        <div className="flex items-center text-green-300 text-base gap-2">
          <span className="text-green-500 font-bold">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBlindTest ? 'Digite o comando de memória...' : target}
            className="flex-1 bg-transparent border-none outline-none text-green-300 focus:ring-0 text-[16px] md:text-sm font-mono p-0"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={onSubmit}
            className="bg-green-600 hover:bg-green-500 active:bg-green-700 text-black font-bold px-3.5 py-1.5 rounded text-xs flex items-center gap-1 shrink-0 transition select-none shadow active:scale-95"
          >
            <span>Validar</span>
            <span className="text-[10px] font-normal bg-black/20 px-1 py-0.5 rounded">↵</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center text-xs text-gray-400 gap-2 pt-1">
        <span>
          Pressione <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">Enter</kbd> ou digite <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">:done</kbd> para o teste cego.
        </span>
        {!isBlindTest ? (
          <button
            type="button"
            onClick={onExitTrigger}
            className="text-amber-400 hover:text-amber-300 text-xs font-mono font-medium underline-offset-2 hover:underline transition"
          >
            Avançar para Teste Cego (:done) →
          </button>
        ) : (
          onExitBlindTest && (
            <button
              type="button"
              onClick={onExitBlindTest}
              className="text-xs bg-[#12151e] hover:bg-[#1a202c] border border-gray-700 text-gray-300 hover:text-white px-3 py-1 rounded transition font-mono"
            >
              [ Esc ] Desistir e Ver Gabarito
            </button>
          )
        )}
      </div>
    </div>
  );
}
