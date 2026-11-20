import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getManPage, getAllManPages } from '@/lib/man-engine';
import { ArrowLeft, BookOpen, Terminal, Check, Copy } from 'lucide-react';

interface ManCmdPageProps {
  params: {
    cmd: string;
  };
}

export function generateStaticParams() {
  const pages = getAllManPages();
  return pages.map((p) => ({
    cmd: p.command
  }));
}

export default function ManCmdPage({ params }: ManCmdPageProps) {
  const page = getManPage(params.cmd);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-gray-200 font-mono p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/man"
              className="text-xs text-gray-400 hover:text-cyan-400 flex items-center gap-1 border border-gray-800 hover:border-gray-700 px-2.5 py-1.5 rounded transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catálogo Geral</span>
            </Link>
            <div className="h-4 w-px bg-gray-800" />
            <h1 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>{page.command.toUpperCase()}({page.sectionName.split(' ')[0]})</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/?topic=linux-basics`}
              className="text-xs bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold px-3 py-1.5 rounded transition flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Treinar no NetDrill</span>
            </Link>
          </div>
        </header>

        {/* Terminal Header & Section Quick Links */}
        <div className="bg-[#10141f] border border-cyan-800/40 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2">
          <span className="text-gray-400">
            MANUAL DO LINUX &middot; {page.title}
          </span>
          <div className="flex items-center gap-3 text-cyan-400">
            <a href="#synopsis" className="hover:underline">SINOPSE</a>
            <a href="#description" className="hover:underline">DESCRIÇÃO</a>
            <a href="#options" className="hover:underline">OPÇÕES</a>
            <a href="#examples" className="hover:underline">EXEMPLOS</a>
          </div>
        </div>

        {/* Manual Content in Classic Terminal Format */}
        <main className="bg-[#0e121b] border border-gray-800 rounded-lg p-6 space-y-6 text-sm">
          {/* NAME */}
          <section id="name">
            <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">NOME</h2>
            <p className="text-gray-300 pl-4">{page.title}</p>
          </section>

          {/* SYNOPSIS */}
          <section id="synopsis">
            <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">SINOPSE</h2>
            <div className="bg-[#06080d] border border-gray-850 rounded p-3 text-emerald-400 font-mono text-xs overflow-x-auto">
              $ {page.synopsis}
            </div>
          </section>

          {/* DESCRIPTION */}
          <section id="description">
            <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-2">DESCRIÇÃO</h2>
            <p className="text-gray-300 pl-4 leading-relaxed whitespace-pre-line">
              {page.description}
            </p>
          </section>

          {/* OPTIONS */}
          <section id="options">
            <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-3">OPÇÕES PRINCIPAIS</h2>
            <div className="space-y-2.5 pl-4">
              {page.options.map((opt, idx) => {
                const parts = opt.split(' : ');
                const flag = parts[0];
                const exp = parts.slice(1).join(' : ');
                return (
                  <div key={idx} className="bg-[#121622] border border-cyan-800/40 p-2.5 rounded text-xs">
                    <span className="text-amber-300 font-bold font-mono">{flag}</span>
                    {exp && <p className="text-gray-300 mt-1 leading-relaxed">{exp}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* EXAMPLES */}
          <section id="examples">
            <h2 className="text-xs font-bold text-cyan-400 tracking-wider mb-3">EXEMPLOS PRÁTICOS EM PRODUÇÃO</h2>
            <div className="space-y-2 pl-4">
              {page.examples.map((ex, idx) => (
                <div key={idx} className="bg-[#06080d] border border-gray-850 rounded p-2.5 font-mono text-xs flex items-center justify-between group">
                  <span className="text-emerald-300">$ {ex}</span>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-600 border-t border-gray-850 pt-4">
          NetDrill Linux Manual Pages &middot; Zero-latency offline reader
        </footer>
      </div>
    </div>
  );
}
