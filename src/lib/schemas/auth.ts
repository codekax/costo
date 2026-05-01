import { z } from 'zod';

export const SignUpSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(72),
  name: z.string().trim().min(1).max(80).optional(),
});

export const SignInSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const MagicLinkSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  redirectTo: z.string().url().optional(),
});

export const RequestPasswordResetSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
});

export const DeleteAccountSchema = z.object({
  confirmation: z.literal('DELETE'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  locale: z.enum(['es', 'en']).optional(),
  timezone: z.string().min(1).max(60).optional(),
});
