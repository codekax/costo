import { z } from 'zod';

export const CurrencySchema = z.enum(['ARS', 'USD']);
export type Currency = z.infer<typeof CurrencySchema>;

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid_date');

export const CreateExpenseSchema = z.object({
  workspaceId: z.string().uuid(),
  projectId: z.string().uuid().nullable(),
  categoryId: z.string().uuid(),
  vendorId: z.string().uuid().nullable().optional(),

  amount: z.number().positive().finite(),
  currency: CurrencySchema,
  fxRateUsed: z.number().positive().finite(),

  paidAt: dateString,
  description: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),

  attachmentUrl: z.string().url().optional(),
  attachmentType: z.enum(['image', 'pdf']).optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.extend({
  id: z.string().uuid(),
  etag: z.string(),
});

export const DeleteExpenseSchema = z.object({
  id: z.string().uuid(),
});

export const ExpenseFiltersSchema = z
  .object({
    projectId: z.string().uuid().nullable().optional(),
    categoryId: z.string().uuid().optional(),
    vendorId: z.string().uuid().optional(),
    currency: CurrencySchema.optional(),
    dateFrom: dateString.optional(),
    dateTo: dateString.optional(),
    search: z.string().trim().max(200).optional(),
  })
  .default({});

export type ExpenseFilters = z.infer<typeof ExpenseFiltersSchema>;
