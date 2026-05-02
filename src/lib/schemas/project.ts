import { z } from 'zod';

/**
 * Project "type" used to be an enum (renovation/general/other). It's now
 * free-text — the user defines their own taxonomy per workspace and the form
 * suggests previously-used values via autocomplete (CreatableCombobox).
 *
 * We still expose `ProjectTypeSchema` and `ProjectType` for typing, but the
 * shape is now `string` with reasonable bounds.
 */
export const ProjectTypeSchema = z.string().trim().min(1).max(60);
export type ProjectType = z.infer<typeof ProjectTypeSchema>;

/** Built-in suggestions seeded into the autocomplete when the workspace is empty. */
export const PROJECT_TYPE_SUGGESTIONS = [
  'Renovación',
  'Construcción',
  'Mantenimiento',
  'General',
  'Mudanza',
  'Otro',
] as const;

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid_date');

/** Treat empty string / null / NaN as "not provided" before zod validates. */
const emptyToUndefined = (schema: z.ZodTypeAny) =>
  z.preprocess((v) => {
    if (v === '' || v === null) return undefined;
    if (typeof v === 'number' && Number.isNaN(v)) return undefined;
    return v;
  }, schema.optional());

export const CreateProjectSchema = z
  .object({
    workspaceId: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    type: ProjectTypeSchema,
    description: emptyToUndefined(z.string().trim().max(2000)),
    startDate: emptyToUndefined(dateString),
    endDate: emptyToUndefined(dateString),
    budgetArs: emptyToUndefined(z.number().positive().finite()),
    budgetUsd: emptyToUndefined(z.number().positive().finite()),
  })
  .refine((v) => !v.endDate || !v.startDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'end_before_start',
  });

export const UpdateProjectSchema = z.object({
  id: z.string().uuid(),
  etag: z.string(),
  name: z.string().trim().min(1).max(100).optional(),
  type: ProjectTypeSchema.optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  startDate: dateString.nullable().optional(),
  endDate: dateString.nullable().optional(),
  budgetArs: z.number().positive().finite().nullable().optional(),
  budgetUsd: z.number().positive().finite().nullable().optional(),
});

export const ArchiveProjectSchema = z.object({
  id: z.string().uuid(),
  archive: z.boolean(),
});

export const DeleteProjectSchema = z.object({
  id: z.string().uuid(),
  confirmation: z.string(),
});
