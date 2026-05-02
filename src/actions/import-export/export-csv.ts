'use server';

import { z } from 'zod';
import { ExpenseFiltersSchema } from '@/lib/schemas/expense';
import { getExpenses } from '@/lib/db/queries/expenses';
import { rowsToCsv } from '@/services/csv/escape-rfc4180';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import { requireWorkspaceMember } from '@/actions/_workspace-guard';

const InputSchema = z.object({
  workspaceId: z.string().uuid(),
  filters: ExpenseFiltersSchema.optional(),
});

const HEADERS = [
  { key: 'paid_at', label: 'fecha' },
  { key: 'project_name', label: 'proyecto' },
  { key: 'category_name', label: 'categoria' },
  { key: 'vendor_name', label: 'vendor' },
  { key: 'description', label: 'descripcion' },
  { key: 'currency', label: 'moneda' },
  { key: 'amount', label: 'monto' },
  { key: 'fx_rate_used', label: 'fx_rate' },
  { key: 'amount_ars', label: 'equivalente_ars' },
  { key: 'amount_usd', label: 'equivalente_usd' },
  { key: 'notes', label: 'nota' },
] as const;

export async function exportCsv(
  input: unknown,
): Promise<ActionResult<{ filename: string; csv: string }>> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  const guard = await requireWorkspaceMember(parsed.data.workspaceId);
  if (!guard.ok) return guard.error;

  try {
    const expenses = await getExpenses(
      guard.supabase,
      parsed.data.workspaceId,
      parsed.data.filters ?? {},
      10_000,
    );

    const rows = expenses.map((e) => ({
      paid_at: e.paid_at,
      project_name: e.project?.name ?? '',
      category_name: e.category.name,
      vendor_name: e.vendor?.name ?? '',
      description: e.description ?? '',
      currency: e.currency,
      amount: Number(e.amount),
      fx_rate_used: Number(e.fx_rate_used),
      amount_ars: Number(e.amount_ars),
      amount_usd: Number(e.amount_usd),
      notes: e.notes ?? '',
    }));

    const csv = rowsToCsv(rows, HEADERS);
    const filename = `costo-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return actionOk({ filename, csv });
  } catch (error) {
    logger.error('export.csv', { error });
    return actionError('unknown');
  }
}
