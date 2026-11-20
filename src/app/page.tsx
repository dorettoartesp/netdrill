import React from 'react';
import Link from 'next/link';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';
import { buildSessionQueue, getAvailableTopics } from '@/lib/session';
import { StudySession } from '@/components/StudySession';
import { TopicSelector } from '@/components/TopicSelector';
import { Button } from '@/components/ui/button';
import { Terminal, PlusCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface HomePageProps {
  searchParams?: {
    topics?: string;
    duration?: string;
  };
}

/**
 * Main application entry page.
 * Displays the TopicSelector dashboard when no topics are chosen in the query string,
 * or boots the active StudySession when topics are selected.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const db = getDbClient();
  await runMigrations(db);

  // If specific topics were requested in query params, launch StudySession with filtered queue
  if (searchParams?.topics) {
    const selectedSlugs = searchParams.topics
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);

    const queue = await buildSessionQueue(db, selectedSlugs);

    if (queue.length > 0) {
      const parsedDuration =
        searchParams.duration !== undefined ? parseInt(searchParams.duration, 10) : 15;
      const initialMinutes = isNaN(parsedDuration) ? 15 : parsedDuration;

      return (
        <main className="min-h-screen bg-[#0c0e14] text-[#e2e8f0]">
          <StudySession
            initialQueue={queue}
            initialMinutes={initialMinutes}
            selectedTopicSlugs={selectedSlugs}
          />
        </main>
      );
    }
  }

  // Otherwise, load available topics and present the TopicSelector dashboard
  const topics = await getAvailableTopics(db);

  if (topics.length === 0) {
    return (
      <main className="min-h-screen bg-[#0c0e14] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-[#161922] border border-gray-800 rounded-xl p-8">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mx-auto">
            <Terminal className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-mono text-green-400">NetDrill</h1>
            <p className="text-sm text-gray-400 font-mono">
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
      <TopicSelector topics={topics} />
    </main>
  );
}
