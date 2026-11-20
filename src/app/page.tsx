import React from 'react';
import Link from 'next/link';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';
import { buildSessionQueue } from '@/lib/session';
import { StudySession } from '@/components/StudySession';
import { Button } from '@/components/ui/button';
import { Terminal, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDbClient();
  await runMigrations(db);

  const queue = await buildSessionQueue(db);

  if (queue.length === 0) {
    return (
      <main className="min-h-screen bg-[#0c0e14] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-[#161922] border border-gray-800 rounded-xl p-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mx-auto">
            <Terminal className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-mono text-green-400">NetDrill</h1>
            <p className="text-sm text-gray-400">
              Nenhum exercício cadastrado no banco de dados ainda.
            </p>
          </div>
          <Link href="/import">
            <Button className="w-full space-x-2">
              <PlusCircle className="w-4 h-4" />
              <span>Importar Módulos em Lote (Bulk JSON)</span>
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0e14] text-[#e2e8f0]">
      <StudySession initialQueue={queue} />
    </main>
  );
}
