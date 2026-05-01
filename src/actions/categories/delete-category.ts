'use server';

import { revalidatePath } from 'next/cache';
import { DeleteCategorySchema } from '@/lib/schemas/category';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function deleteCategory(input: unknown): Promise<ActionResult> {
  const parsed = DeleteCategorySchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  try {
    const supabase = await createServerClient();

    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', parsed.data.id)
      .maybeSingle();

    if (!category) return actionError('not_found');
    if (category.name !== parsed.data.confirmation) return actionError('invalid_input');

    const { error } = await supabase.from('categories').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidatePath('/categories');
    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    return actionOk(undefined);
  } catch (error) {
    logger.error('categories.deleteCategory', { error });
    return actionError('unknown');
  }
}
