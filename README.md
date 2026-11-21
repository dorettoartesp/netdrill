# NetDrill

Plataforma de alta intensidade de repetição espaçada (SM-2) e memória muscular para digitação e fixação cega de comandos técnicos e blocos de configuração (Linux, Redes, FortiGate Firewall, Kubernetes e PostgreSQL).

---

## ⚡ Funcionalidades Principais

- **Treino de Digitação Livre (Loop Infinito):** Digitação repetitiva do comando ou bloco de configuração até fixação muscular. Digite `:done` ou pressione `Ctrl+Enter` para finalizar.
- **Teste Cego com SM-2:** Recall ativo sem visualização da resposta com auto-avaliação (1 a 5) calculando o próximo intervalo de revisão.
- **Suporte a Comandos Multilinha:** Para blocos de configuração (ex.: FortiGate), a caixa de digitação possui exatamente a mesma altura da pré-visualização, evitando quebras visuais e rolagem incômoda.
- **100% Navegável por Teclado:** Controle completo de fluxo via teclado (`Ctrl+Enter` para avançar, `Esc` para reiniciar, `Tab` para navegação, teclas `1-5` para nota).
- **Mobile & Tablet Friendly:** Barra de teclado virtual acessória móvel com símbolos frequentes (`/`, `-`, `_`, `|`, `"`, `$`, `:`, `Tab`, `Ctrl+Enter`) e alvos de toque >= 44x44px. Desativação estrita de corretor e capitalização automática.
- **Importação em Lote via JSON:** Importe decks e tópicos completos com facilidade via UI (`/import`) ou API (`/api/import`). Prompt pronto em `prompts/gerador-conteudo.md`.
- **Autenticação Simples:** Protegido por senha mestra (`APP_PASSWORD=havaianas`) com cookies seguros `HttpOnly`.
- **Galeria de Protótipos:** Servidor local de protótipos de baixa fidelidade via `make prototypes`.

---

## 🚀 Quickstart Local

```bash
# 1. Instalar dependências
npm install

# 2. Executar migrações (o conteúdo é enviado depois pela tela /import)
npm run db:migrate && npm run db:seed

# 3. Iniciar servidor de desenvolvimento
npm run dev

# 4. Acessar a aplicação
# Abra http://localhost:3000
# Senha de acesso: havaianas
```

---

## 🛠️ Comandos Makefile

| Comando | Descrição |
|---|---|
| `make check` | O portão de qualidade inviolável: lint, Semgrep (SAST), Vitest, Gitleaks e portabilidade. |
| `make test` | Executa a suíte de testes automatizados com cobertura (Vitest). |
| `make lint` | Executa o linter (ESLint). |
| `make prototypes` | Sobe o servidor local interativo da galeria de protótipos aprovados na porta 3333. |
| `make deploy` | Provisiona o banco serverless Turso e publica a aplicação na Vercel via CLI. |

---

## ☁️ Deploy em Produção (Turso + Vercel)

A plataforma é pronta para deploy serverless gratuito (Hobby Tier) na Vercel com banco de dados distribuído Turso (libSQL):

1. Autentique as CLIs em seu terminal:
   ```bash
   turso auth login
   npx vercel login
   ```
2. Execute o deploy automatizado zero-touch:
   ```bash
   make deploy
   ```

O script criará o banco `netdrill-prd`, aplicará as migrações e o seed de 30 itens, configurará as variáveis na Vercel e publicará a aplicação executando um smoke test na URL final.

---

## 📝 Importação de Novos Decks

Use o gerador de conteúdo com IA em [`prompts/gerador-conteudo.md`](prompts/gerador-conteudo.md) para gerar JSONs estruturados e importe diretamente em `/import` no navegador.

---

## 📄 Licença

Apache 2.0
