import { z } from 'zod';

export const ExcelRowSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid_date'),
  proyecto: z.string().trim().max(100).optional().default(''),
  categoria: z.string().trim().min(1).max(60),
  vendor: z.string().trim().max(100).optional().default(''),
  descripcion: z.string().trim().max(500).optional().default(''),
  moneda: z.enum(['ARS', 'USD']),
  monto: z.number().positive().finite(),
  fx_rate: z.number().positive().finite().optional(),
  nota: z.string().trim().max(2000).optional().default(''),
});

export type ExcelRow = z.infer<typeof ExcelRowSchema>;
