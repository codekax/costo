'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { DeleteExpenseSchema } from '@/lib/schemas/expense';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function deleteExpense(input: unknown): Promise<ActionResult> {
  const parsed = DeleteExpenseSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  try {
    const supabase = await createServerClient();
    const { data: existing } = await supabase
      .from('expenses')
      .select('workspace_id, project_id')
      .eq('id', parsed.data.id)
      .maybeSingle();

    if (!existing) return actionError('not_found');

    const { error } = await supabase.from('expenses').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidateTag(`workspace:${existing.workspace_id}:expenses`);
    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    if (existing.project_id) revalidatePath(`/projects/${existing.project_id}`);
    return actionOk(undefined);
  } catch (error) {
    logger.error('expenses.deleteExpense', { error });
    return actionError('unknown');
  }
}
