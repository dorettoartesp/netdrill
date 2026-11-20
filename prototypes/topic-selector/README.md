# Protótipo: Seleção de Tópicos (Topic Selector Dashboard)

## Metadados
- **Screen Slug:** `topic-selector`
- **Rota:** `/` (Tela Inicial pós-login)
- **Status:** PENDING_APPROVAL
- **Data:** 2026-11-20

## Histórias de Usuário Atendidas
1. Como estudante de tecnologia, quero visualizar todos os tópicos disponíveis (Linux, Redes, FortiGate, etc.) antes de iniciar a sessão para escolher apenas o assunto que quero treinar hoje.
2. Como usuário focado em teclado, quero poder alternar a seleção dos temas pressionando as teclas numéricas correspondentes (`1`, `2`, `3`) e iniciar o treino com `Enter`.
3. Como estudante, quero poder clicar em "Selecionar Todos (`A`)" ou "Desmarcar Todos" para rapidamente ajustar o escopo do meu estudo.
4. Como estudante, quero ver a contagem de exercícios e itens devidos em cada tópico antes de começar.

## Matriz de Estados
- **Default:** Todos os tópicos marcados como selecionados, botão "Iniciar Treino de Fixação" habilitado com a contagem total de itens.
- **Tópico Desmarcado:** Cartão com borda cinza discreta e badge "Não Selecionado".
- **Nenhum Tópico Selecionado:** Botão de iniciar desabilitado visualmente (`cursor-not-allowed`) para evitar início sem conteúdo.
- **Teclas de Atalho Ativas:** Teclas `1-9` alternam tópicos; `A` seleciona todos; `Enter` dispara a sessão; `I` navega para importação.
