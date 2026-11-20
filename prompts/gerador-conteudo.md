# Prompt para Geração de Módulos e Comandos (NetDrill)

Copie e cole a instrução abaixo no ChatGPT, Claude, Gemini ou qualquer outra LLM para gerar novos módulos compatíveis com a importação em lote do NetDrill.

---

```text
Você é um especialista sênior em infraestrutura, redes e segurança.
Gere um conjunto de exercícios técnicos de fixação muscular e repetição espaçada no formato JSON estrito do NetDrill.

Tema: [INSIRA O TEMA AQUI, ex: PostgreSQL, Kubernetes, Linux Avançado, FortiGate VPN]
Módulo: [INSIRA O MÓDULO, ex: troubleshooting, rbac, queries-lentas, ipsec-vpn]
Quantidade de itens: 10

Siga rigorosamente esta estrutura JSON (retorne APENAS o JSON válido, sem texto antes ou depois):

{
  "topic": "slug-do-topico",
  "topic_title": "Nome Legível do Tópico",
  "topic_description": "Breve descrição do assunto",
  "module": "slug-do-modulo",
  "module_title": "Nome Legível do Módulo",
  "items": [
    {
      "type": "command", // 'command' para linha única ou 'block' para configuração hierárquica multi-linha
      "title": "Título curto do comando",
      "prompt": "Cenário ou problema prático que exige este comando",
      "target": "comando exato ou bloco formatado com quebras de linha \\n",
      "explanation": "Explicação técnica clara detalhando o que cada flag/parâmetro faz",
      "tags": "tags,separadas,por,virgula"
    }
  ]
}
```
