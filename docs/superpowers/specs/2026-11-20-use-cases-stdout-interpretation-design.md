# Design Doc: Casos de Uso, Interpretação de STDOUT & Biblioteca Man no NetDrill

- **Data:** 2026-11-20
- **Status:** Proposto para Aprovação Final
- **Autor:** Antigravity & Doretto
- **Protótipo Interativo:** [http://localhost:4000/educational-study-terminal/](http://localhost:4000/educational-study-terminal/)

---

## 1. Intent & The Why

O NetDrill foi concebido primariamente como uma ferramenta de perfuração e repetição espaçada (SM-2) para memória muscular de digitação CLI. No entanto, memorizar comandos sem compreender o seu contexto operacional e sem saber interpretar suas respostas cria operadores que apenas decoram teclas, mas não sabem agir durante incidentes.

Esta expansão transforma o NetDrill em uma suíte técnica completa de aprendizado e referência para infraestrutura:
1. **Casos de Uso Reais:** Explicar em quais incidentes de produção o comando é acionado (ex.: contenção de I/O, falhas de autenticação, vazamento de memória).
2. **Interpretação de Saída de Terminal (STDOUT Anotado):** Capacitar o usuário a dissecar a saída do comando, compreendendo o que cada métrica/coluna significa, qual é o baseline normal e quais valores caracterizam anomalia crítica.
3. **Biblioteca Embutida de Manuais Linux (`man`):** Consulta das páginas de manual reais dentro da sessão de estudo (`Ctrl+4` / `:man`) e fora da sessão através de uma rota dedicada `/man`.
4. **Proteção de Tempo:** O cronômetro regressivo da sessão congela automaticamente durante a leitura pedagógica (`[EM ESTUDO]`), preservando o tempo estrito de treino muscular.

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
- Oferecer navegação por 4 abas no workspace de estudo:
  - `[ Ctrl+1 ] ⌨️ Treino de Digitação`
  - `[ Ctrl+2 ] 💡 Casos de Uso em Produção`
  - `[ Ctrl+3 ] 🔍 STDOUT Anotado & Diagnóstico`
  - `[ Ctrl+4 ] 📖 Manual Oficial (man)`
- Prover um catálogo de métricas interativo com hotspots clicáveis/hover na saída do terminal, detalhando significado, baseline normal e alertas.
- Iniciar o STDOUT anotado com fallback imediato para todas as 330 questões já existentes via `src/lib/telemetry-glossary.ts`.
- Criar acervo de manuais em Markdown (`src/data/man/[cmd].json` ou `.md`) para os principais comandos de Linux e redes.
- Disponibilizar rota pública `/man` com busca instantânea e rota `/man/[cmd]` com leitor de console estilo `less`.
- Pausar automaticamente o timer da sessão nas abas 2, 3 e 4.

### Não-Metas (Non-Goals)
- Não emular um shell bash com execução de código arbitrário em tempo real.
- Não depender do binário `/usr/bin/man` em runtime no servidor (as páginas são empacotadas estaticamente para garantir compatibilidade serverless total na Vercel).

### Anti-Metas (Anti-Goals)
- **Não poluir a tela de digitação:** A aba `Treino` continua com foco total no prompt e no gabarito, sem distrações.
- **Não queimar o tempo de treino do usuário:** O cronômetro não deve correr enquanto o usuário estuda o manual ou analisa cenários de incidentes.

---

## 3. Abordagens Consideradas & Abordagem Escolhida

### Abordagens Consideradas
1. **Abordagem A (Schema Rígido):** Apenas novas colunas no banco. *Descartada sozinha porque deixaria as 330 questões sem anotações até re-ingestão manual.*
2. **Abordagem B (External Links para man7.org):** Links externos para o manual web. *Descartada porque tira o usuário da aplicação, quebra a navegação por teclado e não funciona offline.*
3. **Abordagem C (Híbrida Integrada - Escolhida):**
   - **Camada 1 (STDOUT Global):** `src/lib/telemetry-glossary.ts` reconhece tokens universais de terminal (`STAT D`, `%CPU`, `wa%`, `Recv-Q`, `RSS`, etc.) e gera hotspots automáticos.
   - **Camada 2 (Schema Flexível):** `items.use_cases` e `items.output_notes` no banco para personalizações de decks ricos, com síntese automática de casos para itens legados.
   - **Camada 3 (Manuais Offline/Serverless):** Repositório local de páginas de manual empacotadas em JSON/Markdown servidas estaticamente na rota `/man` e no leitor embutido da sessão.

---

## 4. Arquitetura e Estrutura Técnica

### 4.1. Estrutura de Manuais (`src/data/man/` e API `/api/man/[cmd]`)
- Arquivos de manual contendo seções: `name`, `synopsis`, `description`, `options`, `examples`.
- Lista inicial de manuais empacotados: `ps`, `top`, `ss`, `ip`, `netstat`, `journalctl`, `systemctl`, `find`, `chmod`, `chown`, `tar`, `grep`, `curl`, `tcpdump`, `iptables`, `nc`, `ping`, `traceroute`, `vmstat`, `iostat`, `free`, `df`, `kill`, `lsof`.
- Rota `/api/man/[cmd]` retorna a página solicitada com cache em memória.

### 4.2. Rota Standalone `/man` e `/man/[cmd]`
- `/man`: Interface de busca instantânea (fuzzy search) com catálogo em cards e atalhos rápidos.
- `/man/[cmd]`: Leitor de manual escuro com rolagem, syntax highlighting de terminal e botão "Praticar este comando no NetDrill".

### 4.2. Modal Flutuante de Manual Linux (`man`)
- **Acesso Universal:** Em qualquer ponto da aplicação, pressionar a tecla `M` (ou `Ctrl+M`), clicar no botão `[ 📖 man (M) ]` ou digitar `:man <cmd>` no prompt de digitação abre o modal flutuante.
- **Busca Rápida:** O topo do modal possui o prompt interativo `$ man [ comando ]`, com busca e autocomplete (ex: `ps`, `top`, `ss`, `iptables`, `find`, `journalctl`).
- **Navegação Estilo `less`:** Seções estruturadas (`NAME`, `SYNOPSIS`, `DESCRIPTION`, `OPTIONS`, `EXAMPLES`), rolagem rápida e leitura limpa.
- **Fechamento Ágil:** Pressionar `Esc` ou a tecla `q` (padrão do `less`/`man`) fecha o modal instantaneamente e devolve o foco para o terminal de estudo.
- **Pausa Automática do Timer:** Durante a exibição do modal, o cronômetro da sessão congela automaticamente com a indicação `[PAUSADO - MAN]`.

### 4.3. Workspace da Sessão (`src/components/StudySession.tsx`)
- Estado da aba ativa: `'treino' | 'casos' | 'stdout'`.
- Atalhos de teclado: `Ctrl+1` (Treino), `Ctrl+2` (Casos), `Ctrl+3` (STDOUT), `M` (Modal Man Flutuante).
- **Timer Lifecycle:** Se `activeTab !== 'treino'` ou se o modal de `man` estiver aberto, o timer de contagem regressiva pausa automaticamente com a indicação `[EM ESTUDO]`, retomando ao retornar para a aba `treino`.

### 4.4. Modelo de Dados (`src/lib/schema.sql`)
```sql
ALTER TABLE items ADD COLUMN use_cases TEXT;
ALTER TABLE items ADD COLUMN output_notes TEXT;
```
- Fallback em memória para itens onde `use_cases` for nulo: síntese de incidente baseada no `prompt` e na `explanation`.

---

## 5. O que fica a cargo do construtor (Left to the Builder)
- Criação dos arquivos JSON dos manuais a partir da extração limpa das man pages do sistema.
- Algoritmo de parser de tokens no componente de STDOUT para não quebrar quebras de linha nem caracteres especiais.
- Implementação da busca fuzzy na rota `/man`.
- Testes unitários com Vitest para a API `/api/man/[cmd]` e para o parser de métricas.
