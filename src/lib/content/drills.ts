import { CommandDoc, ProcedureDoc, OutputNote, UseCase } from './schema';

/** Identifies one drill derived from a content document. */
export interface DrillRef {
  /** `<command id>#<example id>` for example drills, the procedure id for procedure drills. */
  id: string;
  kind: 'example' | 'procedure';
  /** Order of the drill within its document. */
  position: number;
}

/** Everything the study session needs to present one drill. */
export interface DrillContent {
  title: string;
  prompt: string;
  target: string;
  isMultiLine: boolean;
  explanation?: string;
  output?: string;
  /** True when the command (or every procedure step) prints nothing on success. */
  noOutput: boolean;
  outputNotes: OutputNote[];
  useCases: UseCase[];
}

/**
 * Lists the drills a document produces: one per drillable example of a command,
 * or exactly one for a procedure.
 *
 * @param doc - The validated command or procedure.
 * @param kind - Which kind of document `doc` is.
 * @returns Drill references in document order.
 */
export function drillRefsFor(doc: CommandDoc | ProcedureDoc, kind: 'command' | 'procedure'): DrillRef[] {
  if (kind === 'procedure') return [{ id: doc.id, kind: 'procedure', position: 0 }];
  return (doc as CommandDoc).examples
    .filter((ex) => ex.drill)
    .map((ex, position) => ({ id: `${doc.id}#${ex.id}`, kind: 'example' as const, position }));
}

/**
 * Builds the drill presentation from its document.
 *
 * @param ref - The drill reference (from {@link drillRefsFor}).
 * @param doc - The document the drill belongs to.
 * @returns Prompt, target and supporting material for the drill.
 * @throws {Error} When an example drill points to an example that no longer exists.
 */
export function deriveDrillContent(ref: DrillRef, doc: CommandDoc | ProcedureDoc): DrillContent {
  if (ref.kind === 'example') {
    const cmd = doc as CommandDoc;
    const exampleId = ref.id.slice(ref.id.indexOf('#') + 1);
    const ex = cmd.examples.find((e) => e.id === exampleId);
    if (!ex) throw new Error(`Example ${ref.id} not found`);
    return {
      title: ex.title,
      prompt: ex.scenario,
      target: ex.command,
      isMultiLine: ex.command.includes('\n'),
      explanation: ex.explanation,
      output: ex.output,
      noOutput: ex.no_output,
      outputNotes: ex.output_notes,
      useCases: cmd.use_cases,
    };
  }

  const proc = doc as ProcedureDoc;
  const target = proc.steps.map((s) => s.command).join('\n');
  const outputs = proc.steps.map((s) => s.output).filter((o): o is string => Boolean(o && o.trim()));
  return {
    title: proc.title,
    prompt: proc.goal ? `${proc.context}\n\nGoal: ${proc.goal}` : proc.context,
    target,
    isMultiLine: target.includes('\n'),
    output: outputs.length ? outputs.join('\n') : undefined,
    noOutput: proc.steps.every((s) => s.no_output),
    outputNotes: proc.steps.flatMap((s) => s.output_notes),
    useCases: proc.use_cases,
  };
}
