'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { CreateExpenseSchema } from '@/lib/schemas/expense';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import { requireWorkspaceMembership } from '@/lib/workspace-context';
import { createExpenseRecord } from '@/services/expenses/lifecycle';

export async function createExpense(
  input: unknown,
): Promise<ActionResult<{ expenseId: string }>> {
  const parsed = CreateExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  const guard = await requireWorkspaceMembership(parsed.data.workspaceId);
  if (!guard.ok) return actionError(guard.reason);

  try {
    const v = parsed.data;
    const result = await createExpenseRecord(guard.supabase, {
      workspaceId: v.workspaceId,
      projectId: v.projectId,
      categoryId: v.categoryId,
      vendorId: v.vendorId ?? null,
      amount: v.amount,
      currency: v.currency,
      fxRateHint: v.fxRateUsed,
      paidAt: v.paidAt,
      description: v.description,
      notes: v.notes,
      attachmentUrl: v.attachmentUrl,
      attachmentType: v.attachmentType,
      createdBy: guard.user.id,
    });

    if (!result.ok) {
      return actionError(result.reason === 'fx_unavailable' ? 'fx_unavailable' : 'unknown');
    }

    revalidateTag(`workspace:${v.workspaceId}:expenses`);
    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    if (v.projectId) revalidatePath(`/projects/${v.projectId}`);
    return actionOk({ expenseId: result.expenseId });
  } catch (error) {
    logger.error('expenses.createExpense', { error });
    return actionError('unknown');
  }
}
