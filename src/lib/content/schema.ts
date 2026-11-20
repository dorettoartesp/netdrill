import { z } from 'zod';

/** Literal that identifies the v1 content pack format. */
export const PACK_FORMAT = 'netdrill.pack/v1';

/** Drillable lines longer than this many characters produce a non-blocking warning. */
export const LONG_DRILL_LINE = 100;

const TOPIC_SLUG = /^[a-z0-9][a-z0-9-]{0,39}$/;
const DOCUMENT_ID_SUFFIX = /^[a-z0-9][a-z0-9.-]{0,79}$/;
const EXAMPLE_ID = /^[a-z0-9][a-z0-9-]{0,59}$/;

const text = (max = 20_000) => z.string().trim().min(1).max(max);

const outputNoteSchema = z.object({
  token: text(200).describe('Exact text as it appears in the output'),
  meaning: text(),
  normal: text().optional(),
  anomaly: text().optional(),
  severity: z.enum(['info', 'warning', 'critical']).default('info'),
});

const useCaseSchema = z.object({
  title: text(200),
  situation: text(),
  severity: z.enum(['routine', 'incident', 'critical']).default('routine'),
});

const flagSchema = z.object({
  flag: text(80).describe('Short form, e.g. -t'),
  long: z.string().trim().max(80).nullish(),
  argument: z.string().trim().max(80).nullish(),
  description: text(),
  example: z.string().trim().max(400).nullish(),
});

const exampleSchema = z.object({
  id: z.string().regex(EXAMPLE_ID, 'Use lowercase letters, digits and hyphens (max 60 characters).'),
  title: text(200),
  scenario: text().describe('Drill prompt shown to the learner'),
  command: text().describe('Exact command typed by the learner; may be multi-line'),
  explanation: text().optional(),
  output: z.string().max(20_000).optional(),
  output_notes: z.array(outputNoteSchema).default([]),
  drill: z.boolean().default(true),
});

const stepSchema = z.object({
  command: text(),
  purpose: text(),
  output: z.string().max(20_000).optional(),
  output_notes: z.array(outputNoteSchema).default([]),
  interpretation: text().optional(),
});

const documentId = z.string().min(1).max(130);

const commandSchema = z.object({
  id: documentId.describe('<topic.slug>.<name>, e.g. linux.ss'),
  name: text(80),
  summary: text(300),
  synopsis: text(1000),
  description: text(),
  flags: z.array(flagSchema).default([]),
  examples: z.array(exampleSchema).default([]),
  use_cases: z.array(useCaseSchema).default([]),
  pitfalls: z.array(text(2000)).default([]),
  related: z.array(documentId).default([]),
  tags: z.array(text(60)).default([]),
});

const procedureSchema = z.object({
  id: documentId.describe('<topic.slug>.<slug>, e.g. linux.cgroup-oom-triage'),
  title: text(200),
  context: text(),
  goal: text().optional(),
  steps: z.array(stepSchema).min(1),
  uses: z.array(documentId).default([]),
  use_cases: z.array(useCaseSchema).default([]),
  tags: z.array(text(60)).default([]),
});

const topicSchema = z.object({
  slug: z.string().regex(TOPIC_SLUG, 'Use lowercase letters, digits and hyphens (max 40 characters).'),
  title: text(120),
  description: text(1000).optional(),
});

/** Zod schema of a full content pack (one topic, any number of commands and procedures). */
export const packSchema = z
  .object({
    format: z.literal(PACK_FORMAT),
    topic: topicSchema,
    commands: z.array(commandSchema).default([]),
    procedures: z.array(procedureSchema).default([]),
    remove: z.array(documentId).default([]),
  })
  .superRefine((pack, ctx) => {
    if (pack.commands.length + pack.procedures.length + pack.remove.length === 0) {
      ctx.addIssue({ code: 'custom', path: [], message: 'The pack must contain at least one of commands, procedures or remove.' });
    }

    const seen = new Set<string>();
    const checkId = (id: string, path: (string | number)[]) => {
      const prefix = `${pack.topic.slug}.`;
      if (!id.startsWith(prefix) || !DOCUMENT_ID_SUFFIX.test(id.slice(prefix.length))) {
        ctx.addIssue({ code: 'custom', path, message: `Id must look like "${prefix}<name>" using lowercase letters, digits, dots and hyphens.` });
      }
      if (seen.has(id)) {
        ctx.addIssue({ code: 'custom', path, message: `Duplicate id "${id}" in this pack.` });
      }
      seen.add(id);
    };

    pack.commands.forEach((cmd, i) => {
      checkId(cmd.id, ['commands', i, 'id']);
      const exampleIds = new Set<string>();
      cmd.examples.forEach((ex, j) => {
        if (exampleIds.has(ex.id)) {
          ctx.addIssue({ code: 'custom', path: ['commands', i, 'examples', j, 'id'], message: `Duplicate example id "${ex.id}" in this command.` });
        }
        exampleIds.add(ex.id);
      });
    });
    pack.procedures.forEach((proc, i) => checkId(proc.id, ['procedures', i, 'id']));
    pack.remove.forEach((id, i) => {
      if (seen.has(id)) {
        ctx.addIssue({ code: 'custom', path: ['remove', i], message: `"${id}" cannot be imported and removed in the same pack.` });
      }
    });
  });

export type Pack = z.infer<typeof packSchema>;
export type Topic = Pack['topic'];
export type CommandDoc = z.infer<typeof commandSchema>;
export type ProcedureDoc = z.infer<typeof procedureSchema>;
export type Flag = z.infer<typeof flagSchema>;
export type Example = z.infer<typeof exampleSchema>;
export type Step = z.infer<typeof stepSchema>;
export type OutputNote = z.infer<typeof outputNoteSchema>;
export type UseCase = z.infer<typeof useCaseSchema>;

/** A validation problem located by a dotted/bracketed path inside the uploaded JSON ("" = root). */
export interface ValidationIssue {
  path: string;
  message: string;
}

/** Result of validating an uploaded pack. */
export type PackValidation =
  | { ok: true; pack: Pack; warnings: ValidationIssue[] }
  | { ok: false; issues: ValidationIssue[] };

/**
 * Formats a Zod issue path as `commands[0].examples[2].command`.
 *
 * @param path - Path segments from a Zod issue.
 * @returns The formatted path, or an empty string for the root.
 */
export function formatPath(path: ReadonlyArray<PropertyKey>): string {
  return path.reduce<string>((acc, seg) => {
    if (typeof seg === 'number') return `${acc}[${seg}]`;
    return acc ? `${acc}.${String(seg)}` : String(seg);
  }, '');
}

/** Emits a warning for every drillable line longer than {@link LONG_DRILL_LINE}. */
function longLineWarnings(pack: Pack): ValidationIssue[] {
  const warnings: ValidationIssue[] = [];
  const check = (command: string, path: string) => {
    const longest = Math.max(...command.split('\n').map((l) => l.length));
    if (longest > LONG_DRILL_LINE) {
      warnings.push({ path, message: `long drill line (${longest} chars); consider splitting or "drill": false` });
    }
  };
  pack.commands.forEach((cmd, i) =>
    cmd.examples.forEach((ex, j) => {
      if (ex.drill) check(ex.command, `commands[${i}].examples[${j}].command`);
    })
  );
  pack.procedures.forEach((proc, i) =>
    proc.steps.forEach((step, j) => check(step.command, `procedures[${i}].steps[${j}].command`))
  );
  return warnings;
}

/**
 * Validates an uploaded content pack.
 *
 * @param raw - Parsed JSON of unknown shape.
 * @returns The typed pack with defaults applied and non-blocking warnings, or the list of issues.
 */
export function validatePack(raw: unknown): PackValidation {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, issues: [{ path: '', message: 'Expected a pack object.' }] };
  }
  const parsed = packSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({ path: formatPath(i.path), message: i.message })),
    };
  }
  return { ok: true, pack: parsed.data, warnings: longLineWarnings(parsed.data) };
}

/**
 * Generates the JSON Schema of the pack format, embedded in the authoring prompt and the API contract.
 *
 * @returns A JSON Schema object (draft 2020-12).
 */
export function packJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(packSchema, { io: 'input' }) as Record<string, unknown>;
}
