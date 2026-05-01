import { z } from 'zod';

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const UrlFiltersSchema = z.object({
  project: z.string().uuid().nullable().optional(),
  category: z.string().uuid().optional(),
  vendor: z.string().uuid().optional(),
  currency: z.enum(['ARS', 'USD']).optional(),
  from: dateString.optional(),
  to: dateString.optional(),
  q: z.string().max(200).optional(),
  sort: z
    .enum(['paid_at_desc', 'paid_at_asc', 'amount_desc', 'amount_asc'])
    .default('paid_at_desc'),
  page: z.coerce.number().int().min(1).default(1),
});

export type UrlFilters = z.infer<typeof UrlFiltersSchema>;
