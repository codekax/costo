'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { DeleteExpenseSchema } from '@/lib/schemas/expense';
import {
  actionError,
  actionOk,
  defineAction,
  type ActionResult,
} from '@/actions/_define-action';

/**
 * Delete-expense needs dynamic revalidation tied to the expense's workspace
 * and (optional) project — values discoverable only AFTER the SELECT inside
 * the handler. We still use defineAction for the parse/auth/log pipeline
 * but call revalidate manually inside the handler.
 */
const impl = defineAction<typeof DeleteExpenseSchema, void>({
  schema: DeleteExpenseSchema,
  context: 'expenses.deleteExpense',
  handler: async ({ data, supabase }) => {
    const { data: existing } = await supabase
      .from('expenses')
      .select('workspace_id, project_id')
      .eq('id', data.id)
      .maybeSingle();

    if (!existing) return actionError('not_found');

    const { error } = await supabase.from('expenses').delete().eq('id', data.id);
    if (error) throw error;

    revalidateTag(`workspace:${existing.workspace_id}:expenses`);
    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    if (existing.project_id) revalidatePath(`/projects/${existing.project_id}`);
    return actionOk(undefined);
  },
});

export async function deleteExpense(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
