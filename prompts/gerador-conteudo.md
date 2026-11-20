# Prompt para Geração de Módulos e Comandos com Saída de Terminal (NetDrill)

Copie e cole a instrução abaixo no ChatGPT, Claude, Gemini ou qualquer outra LLM para gerar novos módulos compatíveis com a importação em lote do NetDrill contendo exemplos realistas da saída no terminal (`output_sample`).

---

```text
Você é um Engenheiro de Infraestrutura, Redes e Segurança Sênior (Especialista em Linux, Redes TCP/IP, FortiGate, Kubernetes e PostgreSQL).
Gere um conjunto de exercícios técnicos de fixação muscular e repetição espaçada no formato JSON estrito do NetDrill.

Tema: [INSIRA O TEMA: ex: Linux Avançado, Redes TCP/IP, FortiGate Firewall, PostgreSQL DBA, Kubernetes CKA]
Módulo: [INSIRA O MÓDULO: ex: Diagnóstico de Processos, Roteamento BGP, Políticas de Firewall, Queries Lentas, Ingress]
Quantidade de itens: 10

Diretrizes Obrigatórias:
1. "prompt": Cenário prático e realista de produção que justifica o uso do comando.
2. "target": Comando exato (para 'command') ou bloco de configuração hierárquica (para 'block' usando \n).
3. "output_sample": EXEMPLO REALISTA da saída do terminal (stdout/stderr) que o operador veria na tela ao executar o comando no ambiente, permitindo entender visualmente o resultado antes de digitar.
4. "explanation": Explicação técnica minuciosa detalhando cada flag ou cláusula.
5. "tags": Palavras-chave separadas por vírgula.

Siga rigorosamente esta estrutura JSON (retorne APENAS o JSON válido, sem texto antes ou depois):

{
  "topic": "slug-do-topico-em-minusculo",
  "topic_title": "Nome Legível do Tópico",
  "topic_description": "Breve descrição do assunto",
  "module": "slug-do-modulo-em-minusculo",
  "module_title": "Nome Legível do Módulo",
  "items": [
    {
      "type": "command",
      "title": "Listar portas e sockets em escuta",
      "prompt": "Como inspecionar todos os sockets TCP e UDP abertos em modo de escuta com PID do processo?",
      "target": "ss -tulpn",
      "output_sample": "Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process\ntcp   LISTEN 0      128          0.0.0.0:22        0.0.0.0:*    users:((\"sshd\",pid=912,fd=3))\ntcp   LISTEN 0      511          0.0.0.0:80        0.0.0.0:*    users:((\"nginx\",pid=1420,fd=6))",
      "explanation": "-t (TCP), -u (UDP), -l (listening), -p (processo/PID), -n (endereçamento numérico).",
      "tags": "linux,redes,portas,ss"
    },
    {
      "type": "block",
      "title": "Criar política de firewall LAN para WAN com NAT",
      "prompt": "Configurar política de saída no FortiOS permitindo tráfego da rede interna port2 para a Internet port1 com NAT",
      "target": "config firewall policy\n  edit 10\n    set name \"LAN_to_WAN\"\n    set srcintf \"port2\"\n    set dstintf \"port1\"\n    set action accept\n    set schedule \"always\"\n    set service \"ALL\"\n    set nat enable\n  next\nend",
      "output_sample": "FW-DC-01 (policy) # get\n== [ 10 ]\nid: 10   name: LAN_to_WAN\nsrcintf: port2   dstintf: port1   action: accept\nschedule: always   service: ALL   nat: enable\nactive-sessions: 84   bytes: 12.4MB",
      "explanation": "Cria regra de ID 10 aceitando pacotes de port2 para port1 com mascaramento de IP (NAT) ativado.",
      "tags": "fortigate,firewall,nat"
    }
  ]
}
```
