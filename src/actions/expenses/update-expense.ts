'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { UpdateExpenseSchema } from '@/lib/schemas/expense';
import { computeAmounts } from '@/services/fx/snapshot-fx';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function updateExpense(input: unknown): Promise<ActionResult> {
  const parsed = UpdateExpenseSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input', parsed.error.flatten().fieldErrors);

  try {
    const supabase = await createServerClient();
    const v = parsed.data;
    const { amountArs, amountUsd } = computeAmounts({
      amount: v.amount,
      currency: v.currency,
      fxRate: v.fxRateUsed,
    });

    const { data, error } = await supabase
      .from('expenses')
      .update({
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
      })
      .eq('id', v.id)
      .eq('updated_at', v.etag)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return actionError('stale');

    revalidateTag(`workspace:${v.workspaceId}:expenses`);
    revalidatePath('/expenses');
    revalidatePath(`/expenses/${v.id}`);
    revalidatePath('/dashboard');
    return actionOk(undefined);
  } catch (error) {
    logger.error('expenses.updateExpense', { error });
    return actionError('unknown');
  }
}
