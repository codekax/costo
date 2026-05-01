'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { CreateExpenseSchema } from '@/lib/schemas/expense';
import { computeAmounts } from '@/services/fx/snapshot-fx';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import { requireWorkspaceMember } from '@/actions/_workspace-guard';

export async function createExpense(
  input: unknown,
): Promise<ActionResult<{ expenseId: string }>> {
  const parsed = CreateExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  const guard = await requireWorkspaceMember(parsed.data.workspaceId);
  if (!guard.ok) return guard.error;

  try {
    const v = parsed.data;
    const { amountArs, amountUsd } = computeAmounts({
      amount: v.amount,
      currency: v.currency,
      fxRate: v.fxRateUsed,
    });

    const { data, error } = await guard.supabase
      .from('expenses')
      .insert({
        workspace_id: v.workspaceId,
        project_id: v.projectId,
        category_id: v.categoryId,
        vendor_id: v.vendorId ?? null,
        amount: v.amount,
        currency: v.currency,
        fx_rate_used: v.fxRateUsed,
        amount_ars: amountArs,
        amount_usd: amountUsd,
        description: v.description ?? null,
        notes: v.notes ?? null,
        paid_at: v.paidAt,
        attachment_url: v.attachmentUrl ?? null,
        attachment_type: v.attachmentType ?? null,
        created_by: guard.user.id,
      })
      .select('id')
      .single();

    if (error) throw error;

    revalidateTag(`workspace:${v.workspaceId}:expenses`);
    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    if (v.projectId) revalidatePath(`/projects/${v.projectId}`);
    return actionOk({ expenseId: data.id });
  } catch (error) {
    logger.error('expenses.createExpense', { error });
    return actionError('unknown');
  }
}
