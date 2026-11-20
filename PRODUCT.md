# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Engenheiros de Redes, Administradores de Sistemas (Sysadmins), DevOps e SREs que precisam memorizar comandos complexos de infraestrutura (Linux, Roteamento/Switches, FortiGate Firewall, Kubernetes, PostgreSQL) para execução imediata em ambientes de produção sob pressão.

## Product Purpose

NetDrill é uma plataforma de repetição espaçada (SM-2) focada no desenvolvimento de memória muscular para digitação de comandos e blocos de configuração técnica. O sucesso significa que o usuário é capaz de digitar comandos complexos sem consultar documentação, hesitar ou errar parâmetros críticos.

## Positioning

Diferente de flashcards convencionais de múltipla escolha ou perguntas conceituais, o NetDrill exige a digitação exata, caractere por caractere, linha por linha em um prompt de terminal simulado, oferecendo:
1. Treino com gabarito visível para memorização inicial.
2. Modo teste cego acionado pelo comando `:done`, onde todo o gabarito desaparece e o usuário digita de memória.
3. Prévia de saída real de terminal (`stdout`) para cada comando, facilitando a compreensão do comportamento em produção.
4. Algoritmo SM-2 adaptativo que agenda revisões com base na facilidade de recordação.

## Operating Context

- Sessões diárias de 15 a 45 minutos (ou tempo livre).
- Estações de trabalho (Desktop) com 100% de navegação por teclado (`Enter`, `Ctrl+O`, `P`, `F`, `R`, `1-4`).
- Smartphones (Mobile) em deslocamento, com teclado virtual otimizado, barra fixa de símbolos de terminal (`-`, `_`, `/`, `|`, `"`, `$`, `:`, `Tab`) e botões de validação táteis sem distorções de zoom.

## Capabilities and Constraints

- **Stack:** Next.js 15 (App Router), React 19, Tailwind CSS, TypeScript, Turso DB (libSQL Serverless via HTTP).
- **Autenticação:** Proteção de acesso simplificada via senha única de ambiente (`APP_PASSWORD`).
- **Ingestão:** Suporte a importação em lote de decks JSON via upload de arquivo ou colagem direta na rota `/import`.
- **Qualidade & Portabilidade:** Zero caminhos absolutos locais, rigor de lint, testes unitários automatizados com Vitest, gitleaks e semgrep.
- **Localização:** Interface 100% em português brasileiro técnico (pt-BR).

## Product Principles

1. **Autenticidade de Terminal:** A experiência deve parecer um terminal de verdade, com densidade de informação limpa e tipografia monospace cirúrgica.
2. **Latência Zero e Foco Total:** Digitação instantânea, feedback imediato de erro na linha e ausência total de distrações visuais ou animações supérfluas.
3. **Ergonomia Híbrida (Desktop & Mobile):** Eficiência máxima no teclado físico no desktop e botões táteis dedicados com prevenção de zoom automático no mobile.
4. **Respeito ao Algoritmo de Aprendizado:** Agendamento matemático transparente (SM-2) com persistência local resiliente de sessão.

## Accessibility & Inclusion

- Conformidade com diretrizes WCAG 2.1 AA (contraste de texto mínimo 4.5:1 no tema dark do terminal).
- Foco visível inequívoco para navegação exclusiva por teclado.
- Áreas de toque mobile com dimensão mínima de 44x44px (e 48px para botões de submissão primários).
