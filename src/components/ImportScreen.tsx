'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, Copy } from 'lucide-react';
import type { ImportResult } from '@/lib/content/importer';

/** Result panel for a dry run, an import, or a rejected upload. */
export function ImportResultPanel({ result }: { result: ImportResult }) {
  if (!result.ok) {
    return (
      <section role="alert" className="space-y-2 rounded-xl border border-red-900 bg-[#1f0f12] p-3.5">
        <h2 className="m-0 text-sm font-semibold text-red-300">The pack was not imported</h2>
        <ul className="m-0 list-none space-y-1.5 p-0">
          {result.issues.map((i, idx) => (
            <li key={idx} className="font-mono text-[11.5px] leading-snug text-red-200 break-words">
              {i.path ? `${i.path}: ${i.message}` : i.message}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const rows: Array<[string, number]> = [
    ['Documents created', result.summary.documentsCreated],
    ['Documents updated', result.summary.documentsUpdated],
    ['Documents removed', result.summary.documentsRemoved],
    ['Drills created', result.summary.drillsCreated],
    ['Drills removed', result.summary.drillsRemoved],
  ];
  return (
    <section role="status" className="space-y-2.5 rounded-xl border border-green-900 bg-[#0f1a14] p-3.5">
      <h2 className="m-0 text-sm font-semibold text-green-300">{result.dryRun ? 'Valid pack · nothing written yet' : 'Imported'}</h2>
      <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[13px]">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-slate-400">{label}</dt>
            <dd className="m-0 font-mono text-slate-100">{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      {result.warnings.length > 0 && (
        <div className="space-y-1.5 border-t border-green-950 pt-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            {result.warnings.length} {result.warnings.length === 1 ? 'warning' : 'warnings'}
          </span>
          <ul className="m-0 list-none space-y-1 p-0">
            {result.warnings.map((w, idx) => (
              <li key={idx} className="font-mono text-[11.5px] leading-snug text-amber-200 break-words">
                {w.path ? `${w.path}: ${w.message}` : w.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/**
 * Content import screen: copy the authoring prompt, paste or pick a pack, validate (dry run) and import.
 *
 * @param prompt - Authoring prompt built on the server by `buildAuthoringPrompt()`.
 */
export function ImportScreen({ prompt }: { prompt: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Clipboard API unavailable (e.g. insecure context): select the text for manual copy
      promptRef.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((content) => {
      setText(content);
      setResult(null);
    });
  };

  const send = async (dryRun: boolean) => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/import${dryRun ? '?dryRun=true' : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text,
      });
      setResult(await res.json());
    } catch {
      setResult({ ok: false, issues: [{ path: '', message: 'The server could not be reached. Please try again.' }] });
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || !text.trim();

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0e14] text-slate-200 font-sans">
      <header className="h-14 shrink-0 flex items-center gap-1 border-b border-[#1d2230] px-1 lg:px-4">
        <Link href="/" aria-label="Back to sessions" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white">
          <ChevronLeft className="w-6 h-6" aria-hidden="true" />
        </Link>
        <h1 className="m-0 text-[17px] font-semibold">Import content</h1>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-4">
        <section className="space-y-2.5 rounded-xl border border-[#262b3d] bg-[#12141c] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="m-0 text-sm font-semibold">Authoring prompt</h2>
            <button
              type="button"
              onClick={copyPrompt}
              className="min-h-[40px] flex items-center gap-1.5 rounded-lg border border-green-900 bg-[#0f1a14] px-3.5 text-[13px] font-semibold text-green-400 hover:bg-green-950"
            >
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              <span aria-live="polite">{copied ? 'Copied' : 'Copy prompt'}</span>
            </button>
          </div>
          <p className="m-0 text-[13px] leading-snug text-slate-400">
            Paste it into any LLM and replace the placeholder with the topic, commands and procedures you want.
          </p>
          <label htmlFor="prompt-preview" className="sr-only">Prompt preview</label>
          <textarea
            id="prompt-preview"
            ref={promptRef}
            readOnly
            rows={4}
            value={prompt}
            className="w-full resize-y rounded-lg border border-[#1d2230] bg-[#05070a] p-2.5 font-mono text-[11.5px] leading-relaxed text-slate-300"
          />
        </section>

        <section className="space-y-2">
          <label htmlFor="pack-json" className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pack JSON</label>
          <textarea
            id="pack-json"
            rows={10}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setResult(null);
            }}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            placeholder='{ "format": "netdrill.pack/v1", … }'
            className="w-full resize-y rounded-xl border-[1.5px] border-[#262b3d] bg-[#05070a] p-3 font-mono leading-relaxed text-green-400 outline-none focus:border-green-700"
          />
          <label className="flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-300 hover:border-slate-500">
            Choose a .json file
            <input type="file" accept="application/json,.json" onChange={loadFile} className="sr-only" />
          </label>
        </section>

        {result && <ImportResultPanel result={result} />}
      </main>

      <div className="sticky bottom-0 border-t border-[#1d2230] bg-[#0c0e14] px-4 pt-3 pb-safe">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => send(true)}
            className="min-h-[52px] rounded-xl border border-slate-700 text-[15px] font-semibold text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >Validate</button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => send(false)}
            className="min-h-[52px] rounded-xl bg-green-500 text-[15px] font-bold text-green-950 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          >Import</button>
        </div>
      </div>
    </div>
  );
}
