'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ImportPage() {
  const [jsonText, setJsonText] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonText(content);
        setFeedback({
          type: 'success',
          message: `Arquivo "${file.name}" carregado com sucesso. Pressione Ctrl+Enter para gravar no banco.`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setFeedback(null);
    setIsLoading(true);

    try {
      const payload = JSON.parse(jsonText);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: 'error', message: data.error || 'Falha ao importar dados.' });
      } else {
        setFeedback({
          type: 'success',
          message: `${data.message || 'Módulos e itens importados com sucesso!'}`,
        });
        setJsonText('');
      }
    } catch (e: any) {
      setFeedback({
        type: 'error',
        message: `JSON inválido: ${e.message}. Certifique-se de colar a estrutura JSON correta.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleImport();
    }
  };

  return (
    <main className="min-h-screen bg-[#0c0e14] text-[#e2e8f0] p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-mono text-green-400">
            Importação em Lote de Conteúdo
          </h1>
          <p className="text-xs text-gray-400">
            Cole a estrutura JSON gerada por qualquer LLM para cadastrar dezenas de itens de uma só vez
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm" className="space-x-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Treino</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-mono">Estrutura JSON</CardTitle>
            <CardDescription>
              Cole o JSON abaixo ou carregue um arquivo .json. Pressione <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">Ctrl+Enter</kbd> para enviar.
            </CardDescription>
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-1.5 rounded transition font-mono border border-gray-700">
              <Upload className="w-3.5 h-3.5" />
              <span>Carregar Arquivo</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono flex items-center space-x-2 ${
                feedback.type === 'success'
                  ? 'bg-green-950/60 border-green-800 text-green-300'
                  : 'bg-red-950/60 border-red-800 text-red-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <Textarea
            rows={14}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`{
  "topic": "kubernetes",
  "topic_title": "Kubernetes",
  "module": "troubleshooting",
  "items": [
    {
      "type": "command",
      "title": "Ver logs anteriores do container",
      "prompt": "Como inspecionar os logs de um container que crashou?",
      "target": "kubectl logs <pod-name> --previous",
      "explanation": "A flag --previous exibe os logs da execução anterior."
    }
  ]
}`}
            className="font-mono text-xs leading-relaxed"
          />
        </CardContent>

        <CardFooter className="flex justify-end space-x-3">
          <Button
            variant="ghost"
            onClick={() => setJsonText('')}
            disabled={isLoading || !jsonText}
          >
            Limpar
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !jsonText}
            className="space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isLoading ? 'Processando...' : 'Gravar Itens no Banco'}</span>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
