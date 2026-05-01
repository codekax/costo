import { z } from 'zod';

export const CreateVendorSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  contact: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const UpdateVendorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(100).optional(),
  contact: z.string().trim().max(200).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const DeleteVendorSchema = z.object({
  id: z.string().uuid(),
  confirmation: z.string(),
});
