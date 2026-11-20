# Protótipo: Terminal de Treino (Study Terminal)

## Metadados
- **Screen Slug:** `study-terminal`
- **Rota:** `/` (Sessão Ativa de Treino)
- **Status:** APPROVED
- **Aprovado por:** Doretto
- **Data:** 2026-11-20

## Histórias de Usuário Atendidas
1. Como estudante de redes/infraestrutura, quero visualizar o cenário prático e o gabarito detalhado para treinar a digitação de comandos.
2. Como estudante, quero digitar livremente linha por linha sem interrupções até sentir que memorizei e digitar `:done`.
3. Como usuário móvel, quero botões rápidos para caracteres especiais de terminal (`-`, `_`, `/`, `|`, `Tab`, `:done`) sem que o teclado virtual altere os comandos com autocorreção.

## Matriz de Estados
- **Default:** Gabarito visível, contador de tentativas em `#1`, prompt pronto para receber a primeira linha.
- **Linha Correta:** Feedback verde instantâneo e avanço para a próxima linha do bloco.
- **Linha Incorreta:** Destaque em vermelho da linha divergente com foco preservado no input.
- **Teste Cego (`:done`):** Limpeza do gabarito da tela, solicitação da digitação integral de memória.
- **Timer Esgotado:** Notificação limpa e abertura do modal de resumo.
