# Protótipo de Tela: Terminal de Treino Interativo (Study Terminal)

- **Screen Slug:** `study-terminal`
- **Target Route:** `/` (Sessão Ativa de Estudo)
- **Status:** APPROVED
- **Approved By:** Doretto
- **Approval Date:** 2026-11-20
- **Live Local URL:** [http://localhost:4000/study-terminal/](http://localhost:4000/study-terminal/)

---

## Recursos e Histórias de Usuário Implementadas
1. **Digitação 100% Livre de Mouse no Desktop:**
   - `Ctrl+Enter` / `Cmd+Enter` valida o bloco de comandos imediatamente sem necessidade de clicar no botão.
   - `Tab` insere 4 espaços de indentação no prompt sem perder o foco do cursor.
   - Botão com indicação inequívoca de atalho: `[ Validar Bloco Ctrl+↵ ]`.
2. **Otimização da Dobra Vertical (Zero Bloat):**
   - Caixa de saída real do terminal (`[STDOUT]`) agora inicia **recolhida por padrão**, liberando ~180px e mantendo o prompt e o gabarito visíveis na primeira dobra em qualquer tela.
   - Toggle acessível via clique ou atalho global `Ctrl+O`.
   - Ao acertar o bloco, o STDOUT é revelado automaticamente como recompensa de simulação de execução.
3. **Rota de Fuga do Teste Cego:**
   - Se o modo cego for acionado por engano (`:done` ou `Ctrl+Shift+Enter`), um botão visível e a tecla `Esc` permitem cancelar e restaurar o gabarito (`[ Esc ] Desistir e Ver Gabarito`).
4. **Telemetria de Fila:**
   - Indicador de ritmo compacto no topo: `Fila: 3 / 15` com micro barra de progresso.
5. **Ergonomia Mobile & Prevenção de Auto-Zoom:**
   - Fontes de input travadas em `16px` no mobile para neutralizar o zoom automático do iOS Safari.
   - Barra tátil de símbolos de CLI (`-`, `_`, `/`, `|`, `"`, `$`, `:`, `Tab`, `Limpar`) com alvos $\ge 44\text{px}$.
   - Botões de ação primários com altura de $48\text{px}$ na área segura (`.pb-safe`).
6. **Acessibilidade WCAG 2.1 AA:**
   - Todos os contrastes ajustados para $\ge 4.5:1$ (botões de ação, textos secundários `#94a3b8`, sem nested-cards).

---

## Verificação de Responsividade
- [x] **Desktop (>= 1024px):** Layout dividido em 2 colunas proporcionais, atalhos de teclado completos, zero dependência de mouse.
- [x] **Tablet (768px - 1023px):** Ajuste fluido da área de código, preservação da hierarquia.
- [x] **Mobile (< 768px):** Layout verticalizado, barra tátil fixa com safe area, teclado virtual otimizado sem auto-zoom.

## Conformidade com Tokens (`DESIGN.md`)
- [x] Fundo escuro de terminal: `#0c0e14`, `#12151e`, `#0f121a`.
- [x] Tipografia monospace cirúrgica (`JetBrains Mono`, `Fira Code`).
- [x] Paleta semântica: Verde terminal (`#22c55e`), Ciano STDOUT (`#06b6d4`), Âmbar revisão (`#f59e0b`).
- [x] Eliminação de anti-patterns de "AI slop" e eliminação de cartões aninhados (`nested-cards`).
