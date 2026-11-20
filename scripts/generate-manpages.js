const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../src/data/man');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const manpages = [
  {
    command: 'ps',
    title: 'ps - relatório de status dos processos atuais',
    sectionName: '1 (Comandos de Usuário)',
    synopsis: 'ps [opções]',
    description: 'O ps exibe informações sobre uma seleção de processos ativos no sistema operacional. Ao contrário do top, ele fornece um snapshot instantâneo do momento da execução.',
    options: [
      'aux : Sintaxe BSD clássica mostrando todos os processos com usuário, consumo de CPU, memória e estado (STAT).',
      '-ef : Sintaxe padrão UNIX/POSIX exibindo lista completa com UID, PID, PPID e linha de comando.',
      '-o : Permite especificar colunas customizadas de saída (ex: ps -eo pid,user,pcpu,pmem,comm).',
      '--sort : Ordena os processos por uma coluna específica (ex: --sort=-%cpu ou --sort=-%mem).'
    ],
    examples: [
      'ps aux | grep nginx',
      'ps -ef --forest',
      'ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%cpu | head -n 10',
      'ps -u www-data -o pid,stat,time,command'
    ]
  },
  {
    command: 'top',
    title: 'top - visualizador dinâmico de processos em tempo real',
    sectionName: '1 (Comandos de Usuário)',
    synopsis: 'top [-b] [-d delay] [-n iterações] [-p pid] [-u usuário]',
    description: 'O comando top oferece uma visão dinâmica e interativa em tempo real dos processos ativos no kernel Linux, exibindo consumo global de CPU, memória, load average e estatísticas por thread.',
    options: [
      '-b : Modo batch (em lote), ideal para redirecionar a saída para arquivos ou pipelines sem formatação ANSI.',
      '-d delay : Especifica o intervalo de atualização em segundos (padrão é 3.0s).',
      '-n num : Número máximo de iterações antes de sair automaticamente.',
      '-p pid : Monitora exclusivamente os PIDs fornecidos (separados por vírgula).',
      '-u user : Filtra a exibição para processos pertencentes ao usuário indicado.'
    ],
    examples: [
      'top -b -n 1 | head -n 25',
      'top -d 1 -p 1234',
      'top -u nginx',
      'top -b -n 3 -d 2 > top_report.txt'
    ]
  },
  {
    command: 'ss',
    title: 'ss - utilitário moderno para inspeção de sockets de rede',
    sectionName: '8 (Comandos de Administração)',
    synopsis: 'ss [opções] [filtro]',
    description: 'O utilitário ss é o substituto moderno e de alta performance do legado netstat. Ele consulta diretamente as estruturas de rede do kernel via Netlink, sendo ordens de magnitude mais rápido em sistemas com milhares de conexões abertas.',
    options: [
      '-t : Filtra exclusivamente sockets TCP.',
      '-u : Filtra sockets UDP.',
      '-l : Exibe apenas sockets em estado LISTEN (portas abertas aguardando conexões).',
      '-p : Mostra o processo (PID e nome) associado a cada socket (requer privilégios de root).',
      '-n : Não resolve nomes de hosts ou serviços (exibe números de IP e portas), acelerando a saída.',
      '-s : Exibe sumário agregado de sockets alocados e em uso pelo kernel.'
    ],
    examples: [
      'ss -tulpn',
      'ss -ta state established',
      'ss -tlpn sport = :80 or sport = :443',
      'ss -s'
    ]
  },
  {
    command: 'ip',
    title: 'ip - gerenciador unificado de interfaces, rotas, túneis e endereçamento',
    sectionName: '8 (Comandos de Administração)',
    synopsis: 'ip [opções] OBJETO { COMANDO | help }',
    description: 'O utilitário ip substitui a suíte antiga net-tools (ifconfig, route, arp). Ele manipula dispositivos de rede, endereçamento IPv4/IPv6, tabelas de roteamento e políticas de tráfego com precisão.',
    options: [
      '-br (ou -brief) : Formato conciso em uma única linha por interface, facilitando leitura rápida.',
      '-c (ou -color) : Ativa colorização sintática da saída de interfaces e rotas.',
      '-s (ou -stats) : Exibe estatísticas detalhadas de tráfego (bytes, pacotes, erros, drops).',
      '-4 / -6 : Restringe operações ao protocolo IPv4 ou IPv6.'
    ],
    examples: [
      'ip -br a',
      'ip link set eth0 up',
      'ip route show default',
      'ip -s link show eth0',
      'ip addr add 192.168.1.100/24 dev eth0'
    ]
  },
  {
    command: 'find',
    title: 'find - busca recursiva de arquivos na hierarquia de diretórios',
    sectionName: '1 (Comandos de Usuário)',
    synopsis: 'find [caminho...] [expressão]',
    description: 'O find pesquisa recursivamente árvores de diretórios com base em atributos como nome, tamanho, data de modificação, proprietário e permissões, permitindo execução de comandos sobre os arquivos encontrados.',
    options: [
      '-name padrão : Busca por nome de arquivo (sensível a maiúsculas/minúsculas). Use -iname para case-insensitive.',
      '-type tipo : Filtra por tipo (f para arquivo regular, d para diretório, l para symlink).',
      '-mtime n : Modificado há n*24 horas (+n para mais de n dias, -n para menos).',
      '-size n : Filtra por tamanho (k, M, G). Ex: +100M para maiores que 100 megabytes.',
      '-exec cmd {} + : Executa o comando nos arquivos encontrados de forma eficiente em lote.'
    ],
    examples: [
      'find /var/log -type f -name "*.log" -mtime +30',
      'find / -type f -size +1G 2>/dev/null',
      'find /etc -type f -perm 644',
      'find /tmp -type f -name "*.tmp" -exec rm -f {} +'
    ]
  },
  {
    command: 'journalctl',
    title: 'journalctl - consulta e inspeção do diário de logs do systemd',
    sectionName: '1 (Comandos de Usuário)',
    synopsis: 'journalctl [opções...] [correspondências...]',
    description: 'O journalctl consulta os logs binários indexados pelo systemd-journald. Permite filtragem precisa por serviço, prioridade syslog, PID e janela de tempo sem necessidade de múltiplos grep.',
    options: [
      '-u unit : Filtra logs de uma unidade de serviço específica (ex: nginx.service).',
      '-f : Acompanha novos logs em tempo real (follow mode, equivalente a tail -f).',
      '-e : Pula imediatamente para o final do buffer no leitor less.',
      '-p prioridade : Filtra por nível de severidade (emerg, alert, crit, err, warning, notice, info, debug).',
      '--since "tempo" : Restringe logs a partir de uma data/hora relativa (ex: "1 hour ago", "today").',
      '-b : Exibe logs apenas do boot atual ou de boots anteriores (-b -1).'
    ],
    examples: [
      'journalctl -u nginx.service -f',
      'journalctl -p err..emerg --since "1 hour ago"',
      'journalctl -u docker -n 100 --no-pager',
      'journalctl -k -b 0'
    ]
  },
  {
    command: 'systemctl',
    title: 'systemctl - controle do sistema e do gerenciador de serviços systemd',
    sectionName: '1 (Comandos de Usuário)',
    synopsis: 'systemctl [opções] COMANDO [unidade...]',
    description: 'O systemctl é a interface principal para inspecionar e controlar o estado do systemd, incluindo inicialização de serviços, sockets, timers, montagens e alvos de boot.',
    options: [
      'status : Exibe estado detalhado, PID principal, uso de memória e últimos logs da unidade.',
      'start / stop / restart : Inicia, para ou reinicia uma unidade.',
      'reload : Solicita que o serviço recarregue suas configurações sem derrubar conexões ativas.',
      'enable / disable : Configura a inicialização automática do serviço no boot do sistema.',
      'is-active / is-failed : Retorna o status operacional da unidade (útil em scripts).'
    ],
    examples: [
      'systemctl status sshd',
      'systemctl restart nginx',
      'systemctl list-units --type=service --state=failed',
      'systemctl daemon-reload'
    ]
  },
  {
    command: 'chmod',
    title: 'chmod - alteração de permissões de acesso de arquivos e diretórios',
    sectionName: '1 (Comandos de Usuário)',
    synopsis: 'chmod [opções] MODO[,MODO]... ARQUIVO...',
    description: 'O comando chmod modifica os bits de permissão de leitura (r=4), escrita (w=2) e execução (x=1) para usuário dono (u), grupo (g) e outros (o), além de bits especiais como SUID, SGID e Sticky Bit.',
    options: [
      '-R : Aplica permissões recursivamente a todos os subdiretórios e arquivos.',
      '-v : Exibe mensagem verbosa para cada arquivo processado.',
      '-c : Notifica apenas quando uma alteração de permissão for efetivamente realizada.'
    ],
    examples: [
      'chmod 600 ~/.ssh/id_rsa',
      'chmod 755 /var/www/html',
      'chmod -R u=rwX,go=rX /srv/shared',
      'chmod +t /tmp'
    ]
  },
  {
    command: 'iptables',
    title: 'iptables - administração de filtros de pacotes IPv4 e NAT',
    sectionName: '8 (Comandos de Administração)',
    synopsis: 'iptables [-t tabela] COMANDO [cadeia] [regras] [-j alvo]',
    description: 'O iptables configura, mantém e inspeciona as tabelas de filtragem de pacotes IP no kernel Linux (Netfilter), operando nas tabelas filter, nat, mangle e raw.',
    options: [
      '-L : Lista todas as regras da cadeia ou tabela selecionada.',
      '-n : Saída numérica de endereços IP e portas, evitando resolução DNS lenta.',
      '-v : Modo detalhado exibindo contadores de pacotes e bytes para cada regra.',
      '-A : Adiciona (append) uma regra no final da cadeia especificada.',
      '-I : Insere uma regra em uma posição específica da cadeia (padrão é no início, linha 1).',
      '-D : Remove (delete) uma regra por correspondência exata ou por número de linha.'
    ],
    examples: [
      'iptables -L -n -v --line-numbers',
      'iptables -t nat -L -n -v',
      'iptables -A INPUT -p tcp --dport 22 -j ACCEPT',
      'iptables -A INPUT -s 192.168.1.50 -j DROP'
    ]
  },
  {
    command: 'tcpdump',
    title: 'tcpdump - analisador e capturador de tráfego de pacotes de rede',
    sectionName: '8 (Comandos de Administração)',
    synopsis: 'tcpdump [-adeflnNOpqStvxX] [-c contagem] [-i interface] [-w arquivo] [expressão]',
    description: 'O tcpdump captura pacotes que trafegam através de uma interface de rede compatível com a biblioteca libpcap, permitindo filtragem precisa baseada em sintaxe BPF (Berkeley Packet Filter).',
    options: [
      '-i interface : Seleciona a interface de captura (ex: eth0, lo ou "any").',
      '-n : Não converte endereços IP para nomes de host.',
      '-nn : Não converte endereços IP nem portas de protocolo para nomes.',
      '-c n : Encerra a captura após registrar n pacotes.',
      '-w arquivo : Grava os pacotes brutos capturados em formato pcap para posterior análise no Wireshark.',
      '-X : Exibe o cabeçalho e o payload do pacote tanto em hexadecimal quanto em caracteres ASCII.'
    ],
    examples: [
      'tcpdump -i eth0 -nn -c 100',
      'tcpdump -i any -nn port 80 or port 443',
      'tcpdump -i eth0 -nn host 10.0.0.5 and icmp',
      'tcpdump -i eth0 -w /tmp/capture.pcap -c 500 "tcp[tcpflags] & tcp-syn != 0"'
    ]
  },
  {
    command: 'curl',
    title: 'curl - ferramenta de linha de comando para transferência de dados via URLs',
    sectionName: '1 (Comandos de Usuário)',
    synopsis: 'curl [opções...] <url>',
    description: 'O curl transfere dados utilizando protocolos como HTTP, HTTPS, FTP, SFTP, LDAP e dezenas de outros. É o padrão da indústria para testes de APIs, download de arquivos e troubleshooting de rede.',
    options: [
      '-I (ou --head) : Requisita apenas os cabeçalhos HTTP da resposta (método HEAD).',
      '-v (ou --verbose) : Exibe o handshake TLS, cabeçalhos de envio e resposta detalhados.',
      '-s (ou --silent) : Modo silencioso, omitindo medidor de progresso e mensagens de erro.',
      '-L (ou --location) : Segue redirecionamentos HTTP (códigos 301, 302, 307, 308).',
      '-k (ou --insecure) : Permite conexões TLS/SSL sem validação de certificado (útil em ambientes de teste).',
      '-w formato : Formata métricas de tempo da requisição (ex: %{http_code}, %{time_total}).'
    ],
    examples: [
      'curl -I https://netdrill-nine.vercel.app',
      'curl -v https://api.internal.local:8443/health',
      'curl -s -o /dev/null -w "HTTP: %{http_code} | Total: %{time_total}s\\n" https://google.com',
      'curl -X POST https://api.test.com/v1/auth -H "Content-Type: application/json" -d \'{"user":"admin"}\''
    ]
  },
  {
    command: 'vmstat',
    title: 'vmstat - relatório de estatísticas de memória virtual e I/O',
    sectionName: '8 (Comandos de Administração)',
    synopsis: 'vmstat [opções] [intervalo [contagem]]',
    description: 'O vmstat relata informações cruciais sobre processos, memória física, swap, I/O de blocos, interrupções do sistema e atividade de CPU, sendo uma ferramenta fundamental para diagnosticar gargalos de hardware.',
    options: [
      '-s : Exibe tabela sumarizada de eventos de memória desde o boot.',
      '-d : Exibe estatísticas de leitura/escrita por disco.',
      '-w : Formato expandido (wide) para sistemas com grandes volumes de memória RAM.'
    ],
    examples: [
      'vmstat 1 5',
      'vmstat -s',
      'vmstat -d',
      'vmstat -w 2'
    ]
  }
];

for (const mp of manpages) {
  const filePath = path.join(targetDir, `${mp.command}.json`);
  fs.writeFileSync(filePath, JSON.stringify(mp, null, 2), 'utf8');
}

console.log(`Generated ${manpages.length} man pages in ${targetDir}`);
