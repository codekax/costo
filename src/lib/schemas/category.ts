import { z } from 'zod';

export const CreateCategorySchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(60),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  icon: z.string().min(1).max(40),
});

export const UpdateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(60).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .optional(),
  icon: z.string().min(1).max(40).optional(),
});

export const DeleteCategorySchema = z.object({
  id: z.string().uuid(),
  confirmation: z.string(),
});
