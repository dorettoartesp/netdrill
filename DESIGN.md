---
name: NetDrill
description: High-precision retro technical terminal design system for spaced-repetition CLI mastery
colors:
  bg-root: "#0c0e14"
  bg-surface: "#12151e"
  bg-terminal: "#0f121a"
  border-subtle: "#1e2433"
  border-focus: "#22c55e"
  text-primary: "#f1f5f9"
  text-muted: "#94a3b8"
  text-dim: "#64748b"
  accent-green: "#22c55e"
  accent-cyan: "#06b6d4"
  accent-amber: "#f59e0b"
  accent-red: "#ef4444"
  accent-purple: "#a855f7"
typography:
  font-family-mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
  font-family-sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  size-xs: "0.75rem"
  size-sm: "0.875rem"
  size-base: "1rem"
  size-lg: "1.125rem"
  size-xl: "1.25rem"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  terminal-window:
    backgroundColor: "{colors.bg-terminal}"
    borderColor: "{colors.border-subtle}"
    rounded: "{rounded.md}"
    fontFamily: "{typography.font-family-mono}"
  button-primary:
    backgroundColor: "{colors.accent-green}"
    textColor: "{colors.bg-root}"
    rounded: "{rounded.sm}"
  prompt-input:
    backgroundColor: "{colors.bg-terminal}"
    textColor: "{colors.text-primary}"
    caretColor: "{colors.accent-green}"
    fontSizeMobile: "16px"
    fontSizeDesktop: "14px"
---

# NetDrill Design System

## 1. Design Direction: Terminal Retrô & Técnico de Alta Precisão
A estética visual do NetDrill emula um ambiente de console de alta densidade e fidelidade técnica (estilo mainframe/hacker terminal moderno). Evita excessos decorativos ("AI slop", gradientes roxo-para-azul e cards flutuantes sem propósito funcional).

## 2. Paleta de Cores & Superfícies
- **Fundo Principal (Root):** `#0c0e14` (Preto profundo com matiz azulado para evitar saturação excessiva).
- **Superfície do Console (Terminal):** `#0f121a` com borda fina de 1px em `#1e2433`.
- **Texto Principal:** `#f1f5f9` (Contraste 14:1 contra o fundo escuro, excedendo WCAG AAA).
- **Texto Secundário / Labels:** `#94a3b8` (Contraste 6.8:1 contra o fundo, excedendo WCAG AA).
- **Acentos Funcionais:**
  - `accent-green` (`#22c55e`): Linha correta, prompt ativo, sucesso e validação.
  - `accent-cyan` (`#06b6d4`): Telemetria, saída do comando (`stdout`), links e atalhos.
  - `accent-amber` (`#f59e0b`): Modo pausado, alertas de tempo e flags de revisão (`⚑`).
  - `accent-red` (`#ef4444`): Linha divergente/incorreta e erro de validação.
  - `accent-purple` (`#a855f7`): Itens favoritados (`⭐`).

## 3. Tipografia & Escala
- **Fonte Padrão do Terminal:** Monospace (`JetBrains Mono`, `Fira Code`, monospace).
- **Mobile Input Rule:** Todos os campos `<input>` e `<textarea>` no mobile utilizam explicitamente `16px` para impedir o auto-zoom nativo do Safari/iOS.
- **Hierarquia:**
  - `text-xs` (12px): Metadados, atalhos de teclado e contadores.
  - `text-sm` (14px): Comandos no desktop, descrições e histórico de terminal.
  - `text-base` (16px): Inputs no mobile e títulos de módulos.
  - `text-xl` (20px): Título da sessão e timer.

## 4. Ergonomia e Layout
- **Desktop:** Foco 100% no teclado físico. Todos os comandos críticos possuem atalhos de caractere único (`P`, `F`, `R`, `1-4`, `Enter`, `Ctrl+O`).
- **Mobile:** Barra tátil inferior fixa com safe area (`.pb-safe`), botões com área de toque mínima de `44x44px` e botão de submissão `[ Validar ↵ Enter ]` com altura $\ge 48\text{px}$.
- **Densidade:** Espaçamento compacto e limpo, sem margens infladas.

## 5. Acessibilidade (WCAG 2.1 AA)
- Todos os textos normais cumprem ratio de contraste $\ge 4.5:1$.
- Indicador de foco de alta visibilidade com anel verde (`focus-visible:ring-1 focus-visible:ring-emerald-500`).
- Sem dependência exclusiva de cores (ícones e rótulos acompanham todos os estados).
