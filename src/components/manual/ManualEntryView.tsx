import React from 'react';
import Link from 'next/link';
import type { DocumentEntry, DocumentSummary } from '@/lib/content/catalog';
import type { CommandDoc, ProcedureDoc, UseCase } from '@/lib/content/schema';

const SECTION_TITLE = 'm-0 text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans';
const SEVERITY_BADGE: Record<UseCase['severity'], string> = {
  critical: 'border-red-800 text-red-300',
  incident: 'border-amber-800 text-amber-400',
  routine: 'border-cyan-800 text-cyan-300',
};

function UseCases({ items }: { items: UseCase[] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <h2 className={SECTION_TITLE}>Use cases</h2>
      {items.map((uc, i) => (
        <div key={i} className="flex items-start gap-2.5 rounded-xl border border-[#262b3d] bg-[#12141c] px-3 py-2.5">
          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_BADGE[uc.severity]}`}>
            {uc.severity}
          </span>
          <span className="text-[13px] text-slate-300 font-sans">
            <strong className="text-slate-100">{uc.title}.</strong> {uc.situation}
          </span>
        </div>
      ))}
    </section>
  );
}

function DocLinks({ title, items, chip = false }: { title: string; items: DocumentSummary[]; chip?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <h2 className={SECTION_TITLE}>{title}</h2>
      <div className={chip ? 'flex flex-wrap gap-2' : 'flex flex-col gap-1.5'}>
        {items.map((d) => (
          <Link
            key={d.id}
            href={`/man/${d.id}`}
            className={
              chip
                ? 'min-h-[36px] flex items-center rounded-full border border-[#262b3d] px-3 font-mono text-[13px] text-green-400 hover:border-green-700'
                : 'text-sm text-green-400 hover:text-green-300 font-sans'
            }
          >
            {d.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Output({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <pre className="m-0 overflow-x-auto rounded-lg bg-[#05070a] p-2 font-mono text-[11.5px] leading-relaxed text-slate-300">{text}</pre>
  );
}

function CommandBody({ doc }: { doc: CommandDoc }) {
  return (
    <>
      <section className="space-y-1.5">
        <h1 className="m-0 font-mono text-2xl text-slate-50">{doc.name}</h1>
        <p className="m-0 text-sm text-slate-300 font-sans">{doc.summary}</p>
        <code className="block rounded-lg border border-[#1d2230] bg-[#05070a] px-2.5 py-2 font-mono text-[13px] text-sky-300 whitespace-pre-wrap break-all">
          {doc.synopsis}
        </code>
        <p className="m-0 pt-1 text-[13px] leading-relaxed text-slate-400 font-sans whitespace-pre-line">{doc.description}</p>
      </section>

      {doc.flags.length > 0 && (
        <section className="space-y-2">
          <h2 className={SECTION_TITLE}>Flags</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th scope="col" className="border-b border-[#262b3d] py-1.5 pr-2 text-left font-semibold text-slate-400">Flag</th>
                  <th scope="col" className="border-b border-[#262b3d] py-1.5 text-left font-semibold text-slate-400">Description</th>
                </tr>
              </thead>
              <tbody>
                {doc.flags.map((f, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap border-b border-[#1d2230] py-2 pr-2 align-top font-mono text-green-400">
                      {[f.flag, f.long].filter(Boolean).join(', ')}
                      {f.argument ? ` ${f.argument}` : ''}
                    </td>
                    <td className="border-b border-[#1d2230] py-2 align-top text-slate-300 font-sans">
                      {f.description}
                      {f.example && <code className="mt-1 block font-mono text-xs text-slate-400">{f.example}</code>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {doc.examples.length > 0 && (
        <section className="space-y-2">
          <h2 className={SECTION_TITLE}>Examples</h2>
          {doc.examples.map((ex) => (
            <article key={ex.id} className="space-y-2 rounded-xl border border-[#262b3d] bg-[#12141c] p-3">
              <h3 className="m-0 text-sm font-semibold text-slate-100 font-sans">{ex.title}</h3>
              <p className="m-0 text-[13px] text-slate-400 font-sans">{ex.scenario}</p>
              <code className="block font-mono text-sm text-green-400 whitespace-pre-wrap break-all">$ {ex.command}</code>
              {ex.explanation && <p className="m-0 text-[13px] text-slate-400 font-sans">{ex.explanation}</p>}
              <Output text={ex.output} />
            </article>
          ))}
        </section>
      )}

      <UseCases items={doc.use_cases} />

      {doc.pitfalls.length > 0 && (
        <section className="space-y-2">
          <h2 className={SECTION_TITLE}>Pitfalls</h2>
          <ul className="m-0 list-disc space-y-1 pl-5 text-[13px] text-slate-300 font-sans">
            {doc.pitfalls.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}
    </>
  );
}

function ProcedureBody({ doc }: { doc: ProcedureDoc }) {
  return (
    <>
      <section className="space-y-2">
        <h1 className="m-0 text-xl leading-snug text-slate-50 font-sans">{doc.title}</h1>
        <p className="m-0 text-sm text-slate-300 font-sans whitespace-pre-line">{doc.context}</p>
        {doc.goal && (
          <p className="m-0 text-[13px] text-slate-400 font-sans">
            <strong className="text-slate-200">Goal:</strong> {doc.goal}
          </p>
        )}
      </section>
      <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
        {doc.steps.map((step, i) => (
          <li key={i} className="space-y-1.5 rounded-xl border border-[#262b3d] bg-[#12141c] p-3">
            <span className="text-xs font-bold text-slate-400 font-sans">Step {i + 1} · {step.purpose}</span>
            <code className="block font-mono text-[13px] text-green-400 whitespace-pre-wrap break-all">$ {step.command}</code>
            <Output text={step.output} />
            {step.interpretation && <p className="m-0 text-[13px] text-slate-400 font-sans">{step.interpretation}</p>}
          </li>
        ))}
      </ol>
      <UseCases items={doc.use_cases} />
    </>
  );
}

/**
 * Presentational manual entry for a command or a procedure, with cross-reference links
 * and a "Practice" link that opens a session for the entry's topic.
 */
export function ManualEntryView({ entry, compact = false }: { entry: DocumentEntry; compact?: boolean }) {
  const isCommand = entry.summary.kind === 'command';
  return (
    <div className="space-y-5 font-mono text-slate-200">
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400 font-sans">
            {isCommand ? 'Command' : 'Procedure'} · {entry.summary.topicSlug}
          </span>
          <Link
            href={`/?topics=${entry.summary.topicSlug}`}
            className="min-h-[40px] flex items-center rounded-lg border border-green-800 px-3 text-[13px] font-semibold text-green-400 hover:bg-green-950/40 font-sans"
          >
            Practice
          </Link>
        </div>
      )}
      {isCommand ? <CommandBody doc={entry.body as CommandDoc} /> : <ProcedureBody doc={entry.body as ProcedureDoc} />}
      <DocLinks title="Commands used" items={entry.uses} chip />
      <DocLinks title="Used in procedures" items={entry.usedBy} />
      <DocLinks title="Related commands" items={[...entry.related, ...entry.relatedBy.filter((d) => !entry.related.some((r) => r.id === d.id))]} chip />
    </div>
  );
}
