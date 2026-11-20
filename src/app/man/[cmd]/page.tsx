import React from 'react';
import Link from 'next/link';
import { getDbClient } from '@/lib/db';
import { runMigrations } from '@/lib/migrate';
import { getDocument } from '@/lib/content/catalog';
import { ManualEntryView } from '@/components/manual/ManualEntryView';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Manual entry page for one uploaded command or procedure, addressed by document id (`/man/linux.ss`).
 */
export default async function ManEntryPage({ params }: { params: { cmd: string } }) {
  const id = decodeURIComponent(params.cmd ?? '').trim().toLowerCase();
  const db = getDbClient();
  await runMigrations(db);
  const entry = id ? await getDocument(db, id) : null;

  return (
    <main className="min-h-screen bg-[#0c0e14] text-[#e2e8f0]">
      <header className="h-14 flex items-center gap-1 border-b border-[#1d2230] px-1 lg:px-4">
        <Link href="/man" aria-label="Back to manual" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white">
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </Link>
        <span className="text-[17px] font-semibold font-sans">Manual</span>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-5">
        {entry ? (
          <ManualEntryView entry={entry} />
        ) : (
          <div className="py-16 text-center space-y-3 font-sans">
            <p className="text-slate-300">No manual entry found for this command.</p>
            <Link href="/man" className="text-green-400 hover:text-green-300 text-sm">Back to the manual</Link>
          </div>
        )}
      </div>
    </main>
  );
}
