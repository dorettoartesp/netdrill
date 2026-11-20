# Protótipo de Tela: Terminal Didático com Casos de Uso, STDOUT Anotado & Modal Flutuante Man

- **Screen Slug:** `educational-study-terminal`
- **Target Route:** `/` (Sessão Ativa com Camada Didática Expandida)
- **Status:** PENDING_APPROVAL
- **Approved By:** Aguardando aprovação de Doretto
- **Approval Date:** 2026-11-20
- **Live Local URL:** [http://localhost:4000/educational-study-terminal/](http://localhost:4000/educational-study-terminal/)

---

## Recursos e Histórias de Usuário Atendidas
1. **Modal Flutuante de Manual Linux (`man`) em Qualquer Ponto:**
   - **Atalho `M` ou `Ctrl+M`**: Em qualquer ponto da aplicação, pressionar `M` abre um modal flutuante de console estilo `less`.
   - **Busca Rápida de Comandos**: O topo do modal possui o prompt `$ man [ comando ]` permitindo consultar `ps`, `top`, `ss`, `iptables`, `find`, etc.
   - **Comando Inline no Prompt**: Digitar `:man` ou `:man <cmd>` no próprio prompt de estudo abre imediatamente o manual do comando.
   - **Fechamento Instantâneo**: Pressionar `Esc` ou `q` fecha o modal e retorna o usuário exatamente onde estava.
   - **Pausa Automática do Cronômetro**: Durante a leitura do manual, o timer congela (`PAUSADO (MAN)`), sem consumir tempo de treino muscular.

2. **Aprender o Contexto Real (Casos de Uso em Produção):**
   - Aba `[ Ctrl+2 ] 💡 Casos de Uso`: Detalha incidentes e problemas reais (ex: 100% CPU, OOM-Killer, lentidão de storage).

3. **Interpretação e Diagnóstico do Resultado (STDOUT Anotado):**
   - Aba `[ Ctrl+3 ] 🔍 Interpretação do STDOUT`: Hotspots clicáveis nas métricas (`STAT D`, `%CPU`, `RSS`, `TIME+`), detalhando significado, baseline normal e alertas de anomalia.

4. **Navegação 100% por Teclado:**
   - `Ctrl+1` (Treino), `Ctrl+2` (Casos), `Ctrl+3` (STDOUT), `M` (Modal Man), `Esc / q` (Fechar).

---

## Verificação de Anti-Patterns (Impeccable & OpenDesign)
- [x] Zero cartões aninhados (`nested-cards`).
- [x] Contraste WCAG AA $\ge 4.5:1$ em todos os textos e badges.
- [x] Tipografia monospace e fontes de input $\ge 16\text{px}$ no mobile.
- [x] Validação automatizada com `npx impeccable detect`: **Exit Code 0 (0 warnings / 0 advisories)**.
