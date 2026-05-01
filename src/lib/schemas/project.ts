import { z } from 'zod';

export const ProjectTypeSchema = z.enum(['renovation', 'general', 'other']);
export type ProjectType = z.infer<typeof ProjectTypeSchema>;

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid_date');

export const CreateProjectSchema = z
  .object({
    workspaceId: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    type: ProjectTypeSchema,
    description: z.string().trim().max(2000).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
    budgetArs: z.number().positive().finite().optional(),
    budgetUsd: z.number().positive().finite().optional(),
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
