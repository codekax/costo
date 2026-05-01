'use server';

import { revalidatePath } from 'next/cache';
import { UpdateCategorySchema } from '@/lib/schemas/category';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function updateCategory(input: unknown): Promise<ActionResult> {
  const parsed = UpdateCategorySchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input', parsed.error.flatten().fieldErrors);

  try {
    const supabase = await createServerClient();
    const update: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) update.name = parsed.data.name;
    if (parsed.data.color !== undefined) update.color = parsed.data.color;
    if (parsed.data.icon !== undefined) update.icon = parsed.data.icon;

    const { error } = await supabase.from('categories').update(update).eq('id', parsed.data.id);

    if (error) {
      if (error.code === '23505') return actionError('conflict');
      throw error;
    }

    revalidatePath('/categories');
    revalidatePath('/expenses');
    return actionOk(undefined);
  } catch (error) {
    logger.error('categories.updateCategory', { error });
    return actionError('unknown');
  }
}
