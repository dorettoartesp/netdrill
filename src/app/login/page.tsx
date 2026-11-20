'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Senha incorreta. Tente novamente.');
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Falha de conexão com o servidor de autenticação.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0c0e14] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-400 font-mono tracking-wider">
            NetDrill
          </CardTitle>
          <CardDescription>
            Acesso ao Terminal de Fixação e Repetição Espaçada
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-300 text-xs font-mono">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono"
              >
                Senha de Acesso
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Informe sua senha pessoal..."
                autoFocus
                disabled={isLoading}
                className="text-center font-mono text-base tracking-widest"
              />
              <p className="text-[11px] text-gray-500 font-mono">
                Pressione <kbd className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">Enter</kbd> para autenticar.
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full space-x-2"
            >
              <span>{isLoading ? 'Autenticando...' : 'Acessar Terminal'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
