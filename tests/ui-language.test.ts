import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../src');
const PORTUGUESE = /[ãõçáéíóúâêôà]|\b(Sessão|Sessao|Tópico|Topico|Exercício|Importar|Sair|Validar|Gabarito|Treino|Cenário|Revisão|Revisar|Pausar|Pausado|Retomar|Favoritar|Favorito|Comando|Selecione|Selecionar|Digite|Arquivo|Falha|inválid|Teste cego|Limpar|Senha|Quebrar|Mostrar|Ocultar|Voltar|Nenhum|Pressione|Tentativa|Acessar|Livre|Iniciar|Desmarcar|Tempo|Resumo|Painel|Mudar|Ver |Casos de uso|Saída|linhas|Avançar|Desistir|Bloco|cego|Em dia|Concluída|de|da|dos|das|para|ou|uma|nao|sem|Linha|Alerta|Modos|Inspetor)\b/i;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return /\.(tsx?|css)$/.test(name) ? [full] : [];
  });
}

/** Removes comments so docstrings do not count as UI copy. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'`])\/\/.*$/gm, '$1');
}

describe('UI language', () => {
  it('has no Portuguese strings in source code', () => {
    const offenders: string[] = [];
    for (const file of files(ROOT)) {
      stripComments(readFileSync(file, 'utf8'))
        .split('\n')
        .forEach((line, i) => {
          if (PORTUGUESE.test(line)) offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 100)}`);
        });
    }
    expect(offenders).toEqual([]);
  });
});
