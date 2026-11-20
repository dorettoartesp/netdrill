# Design Doc: NetDrill — Plataforma de Repetição Espaçada e Fixação Muscular de Comandos & Configurações

**Data:** 2026-11-20  
**Status:** Proposto para Aprovação  
**Template Base:** `https://github.com/dorettoartesp/agentic-tmpl/` (`agentic-tmpl`)  
**Stack Principal:** Next.js (React + TypeScript + Tailwind CSS) + Turso DB (libSQL) + Vercel (Deploy Gratuito)

---

## 1. Visão Geral e Intenção (The Why)

### 1.1 Contexto e Motivação
Aprender e reter comandos de infraestrutura, redes e segurança (como Linux, Redes de Computadores e Firewall FortiGate, expandindo futuramente para PostgreSQL, Kubernetes, etc.) é um desafio crítico:
* Comandos e diretivas técnicas exigem **memória muscular** e precisão de sintaxe que leitura passiva ou flashcards tradicionais (onde apenas se "vira a carta") não desenvolvem.
* A retenção a longo prazo exige **repetição espaçada estruturada** para evitar a curva do esquecimento de Ebbinghaus.
* O usuário necessita de um ambiente prático e acessível de qualquer dispositivo (desktop, notebook, tablet ou smartphone), com custo zero de infraestrutura e facilidade total para gerar e importar dezenas de novos módulos utilizando Modelos de Linguagem (LLMs).

O **NetDrill** é uma plataforma web responsiva, leve e de código aberto projetada para treinar intensivamente comandos e blocos de configuração hierárquicos através de digitação repetitiva até a fixação, validação cega de memória, múltiplos modos de treino e revisão espaçada baseada no algoritmo SM-2.

---

## 2. Objetivos, Não-Objetivos e Anti-Objetivos

### 2.1 Estratégia de Entrega em Fases (MVP Rápido Primeiro)

Para colocar uma **versão 100% funcional e online no menor tempo possível**, o projeto é dividido em duas fases claras:

* **FASE 1 (MVP Funcional Online — Foco Imediato):**
  1. **Core de Treino Muscular:** Digitação livre linha a linha para comandos e blocos de configuração (Linux, Redes, FortiGate), loop até `:done`, e teste cego final.
  2. **Controle de Tempo:** Timer diário configurável (ex: 15 min) com término limpo e estatísticas básicas.
  3. **Importação em Lote (Bulk JSON):** Página simples para colar JSON gerado por LLM e popular o banco Turso.
  4. **Responsividade Mobile:** Teclado limpo (sem corretor/maiúsculas automáticas) e barra de atalhos rápidos (`-`, `_`, `/`, `|`, `Tab`, `:done`).
  5. **Deploy Automatizado Zero-Touch:** Agente executa o setup do Turso DB e deploy na Vercel 100% via CLI (sem intervenção manual do usuário).

* **FASE 2 (Melhorias e Expansões Futuras):**
  * Exportadores para Anki (`.apkg`/`.tsv`) e Markdown/Obsidian.
  * Modos alternativos de jogo (Complete a Lacuna / Cloze e Múltipla Escolha / Quiz).
  * Desafios com imagens/diagramas e lightbox zoom.

### 2.2 Não-Objetivos (Non-Goals)
1. Não é um simulador de máquina virtual (VM) ou container Docker rodando no navegador (o foco é a memorização de sintaxe, raciocínio e comandos, não orquestração de infraestrutura de emulação).
2. Não possui paywalls, planos pagos ou dependência de serviços externos com cobrança.
3. Não requer autenticação obrigatória complexa para uso pessoal/estudos (suporta uso direto local ou autenticação simplificada de admin para importações).

### 2.3 Anti-Objetivos (Anti-Goals)
1. Evitar flashcards passivos onde o usuário apenas lê a resposta sem esforço ativo de recordação.
2. Evitar interfaces pesadas ou que "durmam" após inatividade (como instâncias free tier convencionais de containers que demoram 1 minuto para acordar).
3. Evitar formulários manuais linha por linha para criar exercícios; o cadastro deve ser primordialmente automatizado e em lote (bulk) via LLMs.

---

## 3. Abordagens Consideradas e Decisão

| Abordagem | Descrição | Prós | Contras | Veredito |
|---|---|---|---|---|
| **1. CLI em Python (Prompt Toolkit / Rich) + libSQL** | Utilitário executado exclusivamente no terminal local Linux via `uv`. | Sensação 100% nativa de shell, leveza, facilidade para scripts rápidos. | Restrito ao computador onde está instalado; não atende ao requisito de estudar no celular ou tablet fora de casa. | Descartada após mudança de escopo para deploy web. |
| **2. CLI Binário Único em Go (Bubbletea)** | Executável compilado em Go com driver libSQL. | Binário estático sem dependências externas, performance instantânea. | Rígido para alterações, não funciona nativamente no navegador mobile. | Descartada. |
| **3. Web App Responsiva (Next.js + Tailwind + Turso DB na Vercel)** | Aplicação Web moderna com estética de terminal, banco libSQL e hospedagem serverless na Vercel. | Acessível em qualquer dispositivo (desktop, notebook, tablet, celular), deploy gratuito sem suspensão, suporte a imagens, importação e exportação de decks com 1 clique. | Requer teclado virtual ajustado no mobile (solucionado com barra de atalhos e travas de autocorreção). | **Escolhida (Aprovada pelo usuário)** |

---

## 4. Arquitetura do Sistema e Stack Tecnológica

### 4.1 Fundação: `agentic-tmpl`
O projeto será inicializado a partir do template `agentic-tmpl` via `scripts/init-project.sh`:
* **Nome do Projeto:** NetDrill (Repositório: `netdrill`)
* **Makefile Facade:** `make dev` (inicia Next.js dev server), `make lint` (ESLint/TypeScript check), `make test` (Vitest/Jest), `make check` (Quality Gate: lint + SAST Semgrep + Gitleaks scan + portability).
* **Documentação Viva:** `docs/` integrado ao MkDocs Material (`make docs`).

### 4.2 Stack de Software
* **Framework:** Next.js 14+ (App Router, Server Actions e API Routes).
* **Linguagem:** TypeScript (estrita tipagem de dados).
* **Estilização:** Tailwind CSS com tema escuro padrão (*Terminal Matrix/Cyber/Slate*) e fontes monoespaçadas (`JetBrains Mono` ou `Fira Code`).
* **Banco de Dados:** Turso DB (libSQL Serverless) utilizando a biblioteca oficial `@libsql/client`. Em desenvolvimento local, suporta arquivo SQLite local (`file:local.db`) ou banco remoto na nuvem Turso.
* **Algoritmo de Intervalos:** Algoritmo SuperMemo-2 (SM-2) para agendamento de revisões espaçadas baseado no fator de facilidade (Ease Factor), repetições consecutivas e intervalo em dias.
* **Exportadores de Memória:**
  * Anki: `genanki-js` (para gerar pacotes binários `.apkg` no browser) e gerador de `.tsv` tabulado.
  * Obsidian / PKM: Formatador de Markdown com sintaxe de flashcard (`::`).
  * Universal: Exportador JSON e CSV.
* **Hospedagem & Deploy:** Vercel (Hobby Tier 100% gratuito, integração contínua via GitHub).

---

## 5. Modelo de Dados (Turso / libSQL Schema)

```sql
-- 1. Trilhas / Tópicos (ex: linux, fortigate, redes, kubernetes, postgresql)
CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Módulos / Categorias (ex: fortigate/firewall-policies, kubernetes/troubleshooting)
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id, slug)
);

-- 3. Itens de Estudo / Desafios
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('command', 'block', 'cloze', 'quiz')),
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,              -- Pergunta / Cenário prático
    target TEXT NOT NULL,              -- Comando ou bloco completo gabarito
    explanation TEXT,                  -- O que o comando/flags fazem em detalhes
    image_url TEXT,                    -- URL opcional de print de tela ou topologia
    cloze_data TEXT,                   -- JSON: partes ocultadas e opções para preenchimento
    quiz_options TEXT,                 -- JSON: 4 opções de múltipla escolha
    tags TEXT,                         -- Tags separadas por vírgula
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Estado da Repetição Espaçada e Histórico de Prática
CREATE TABLE IF NOT EXISTS user_progress (
    id TEXT PRIMARY KEY,
    item_id TEXT UNIQUE NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    repetitions INTEGER DEFAULT 0,     -- Número de revisões espaçadas bem-sucedidas
    interval_days INTEGER DEFAULT 0,   -- Intervalo até a próxima revisão
    ease_factor REAL DEFAULT 2.5,      -- Fator de facilidade do SM-2
    due_date DATETIME NOT NULL,        -- Data em que o item deve ser revisado
    total_drilled_count INTEGER DEFAULT 0, -- Total de repetições musculares feitas
    last_reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para buscas ultra-rápidas
CREATE INDEX IF NOT EXISTS idx_modules_topic ON modules(topic_id);
CREATE INDEX IF NOT EXISTS idx_items_module ON items(module_id);
CREATE INDEX IF NOT EXISTS idx_progress_due ON user_progress(due_date);
```

---

## 6. Fluxos de Estudo e Experiência do Usuário (UX)

### 6.1 Configuração e Início da Sessão
1. O usuário seleciona o tópico (ou estuda "Todos os Tópicos").
2. Escolhe o **tempo da sessão** (10 min, 15 min, 20 min, 30 min ou livre).
3. O motor de agendamento monta a fila da sessão:
   * **Fase 1 (Prioridade Máxima):** Itens com revisão pendente (`due_date <= agora`), ordenados pelos mais atrasados.
   * **Fase 2 (Novos Aprendizados):** Se sobrar tempo ou não houver revisões pendentes, introduz novos itens ainda não estudados.
4. O timer regressivo permanece visível no cabeçalho. Ao zerar o tempo, o exercício atual é finalizado sem interrupção brusca e a tela de resumo exibe o desempenho da sessão (tempo gasto, repetições musculares feitas, itens retidos).

### 6.2 Modo 1: Digitação Muscular (Free Drill & Blind Test)
1. **Apresentação:** O sistema exibe o objetivo, o gabarito (de linha única ou bloco hierárquico) e a explicação linha por linha das flags e subcomandos. Se houver imagem, ela é exibida acima.
2. **Loop de Repetição Livre:**
   * O usuário digita linha a linha.
   * Cada linha correta dá feedback visual verde imediato. Se errar, aponta o caractere/palavra divergente na hora para correção.
   * Ao completar o bloco, o contador incrementa (`Tentativa #4`, `#5`, `#12`...) e o prompt reinicia instantaneamente.
   * O usuário digita quantas vezes quiser até sentir que a memória muscular gravou a sintaxe.
3. **Comando de Saída (`:done`):**
   * O usuário digita `:done` ou clica no botão rápido.
4. **Teste Cego Final:**
   * A tela limpa o gabarito de referência.
   * O usuário precisa digitar a configuração completa 100% de memória.
   * Se acertar, o item é graduado com sucesso, registrado no algoritmo SM-2 e agendado para o dia seguinte. Se errar, o gabarito reaparece para mais uma rodada de treino.

### 6.3 Modo 2: Complete a Lacuna (Cloze)
* O comando ou bloco aparece com uma ou mais partes sensíveis ocultadas por `_____`.
* 3 a 4 botões de opções aparecem logo abaixo.
* O usuário toca na alternativa correta ou digita o atalho numérico (1-4).
* Excelente para celular ou para momentos de treino rápido sem digitação exaustiva.

### 6.4 Modo 3: Múltipla Escolha (Quiz)
* Apresenta um cenário prático ou print de tela de menu/ferramenta gráfica.
* Pergunta qual opção/comando realiza aquela tarefa.
* 4 alternativas objetivas.

### 6.5 Experiência Mobile & Barra de Atalhos
* Input de texto estilizado como terminal com `autocorrect="off"`, `autocapitalize="none"`, `spellcheck="false"`, `autocomplete="off"`.
* Barra de botões logo acima do teclado virtual no mobile: `[ - ]`, `[ _ ]`, `[ / ]`, `[ | ]`, `[ Tab ]`, `[ :done ]`.
* Imagens exibidas com suporte a toque para abrir em modal Lightbox com zoom.

---

## 7. Importação em Lote (Bulk) e Exportação de Memória

### 7.1 Importação em Lote via LLM
Na aba `/import`, o usuário cola um JSON ou sobe um arquivo `.json`. A plataforma valida a integridade do JSON, exibe uma tabela de pré-visualização e grava os dados no Turso DB com um clique.

**Schema Universal de Importação:**
```json
{
  "topic": "kubernetes",
  "module": "troubleshooting",
  "items": [
    {
      "type": "command",
      "title": "Ver logs do container anterior após crash",
      "prompt": "Como verificar os logs da última execução de um container que sofreu crash?",
      "target": "kubectl logs <pod-name> -c <container> --previous",
      "explanation": "A flag --previous inspeciona a instância encerrada do container no Pod.",
      "tags": "k8s,logs,troubleshooting"
    },
    {
      "type": "block",
      "title": "Política de Firewall LAN para WAN com NAT",
      "prompt": "Criar política no FortiOS liberando tráfego da port2 para port1 com NAT ativo.",
      "target": "config firewall policy\n    edit 10\n        set name \"LAN-Internet\"\n        set srcintf \"port2\"\n        set dstintf \"port1\"\n        set action accept\n        set schedule \"always\"\n        set service \"ALL\"\n        set nat enable\n    next\nend",
      "explanation": "Habilita tráfego irrestrito de saída mascarando o IP da LAN com NAT na WAN.",
      "tags": "fortigate,firewall,nat"
    },
    {
      "type": "quiz",
      "title": "Portas TCP em Escuta no Linux",
      "prompt": "Qual comando lista portas TCP abertas com identificação numérica e processo?",
      "target": "ss -tulpn",
      "quiz_options": [
        "ip route show",
        "ss -tulpn",
        "netstat -rn",
        "traceroute -n"
      ],
      "explanation": "ss substitui o netstat; -t (TCP), -u (UDP), -l (listening), -p (process), -n (numeric)."
    }
  ]
}
```

O repositório incluirá o arquivo `prompts/gerador-conteudo.md` contendo a instrução exata para copiar e colar em qualquer LLM (Claude, ChatGPT, Gemini).

### 7.2 Exportação com 1 Clique
No menu de exportação, o usuário pode baixar:
1. **Anki Package (`.apkg`) e TSV:** Arquivo binário pronto ou texto separado por tabs contendo Frente, Verso e Explicação, gerado no cliente via `genanki-js`.
2. **Obsidian / Logseq Markdown:** Arquivo `.md` com formatação `Pergunta::Resposta` e tags de flashcard.
3. **JSON Aberto:** Exportação completa de todos os campos e histórico de repetições.

---

## 8. O que Fica a Cargo do Construtor (Builder Call)
1. **Paleta de Cores e Temas:** Definir a paleta visual padrão Tailwind (recomenda-se tema escuro slate/zinc com acentos verde-terminal `#22c55e` e âmbar `#f59e0b`).
2. **Seeds Iniciais de Conteúdo:** Fornecer um pacote inicial com ao menos 30 exercícios fundamentais (10 de Linux, 10 de Redes e 10 de FortiGate) já embutidos no banco para o primeiro uso.
3. **Estratégia de Validação de Sintaxe:** Normalização suave de espaços em branco e quebras de linha nas comparações para evitar reprovações por espaços extras acidentais no fim de linha.
4. **Configuração dos Scripts de Qualidade do `agentic-tmpl`:** Garantir que `make check` execute os linters do Next.js/TypeScript e a suíte de testes unitários sem erros.
