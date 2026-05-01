'use server';

import { revalidatePath } from 'next/cache';
import { CreateCategorySchema } from '@/lib/schemas/category';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import { requireWorkspaceMember } from '@/actions/_workspace-guard';

export async function createCategory(
  input: unknown,
): Promise<ActionResult<{ categoryId: string }>> {
  const parsed = CreateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  const guard = await requireWorkspaceMember(parsed.data.workspaceId);
  if (!guard.ok) return guard.error;

  try {
    const { data, error } = await guard.supabase
      .from('categories')
      .insert({
        workspace_id: parsed.data.workspaceId,
        name: parsed.data.name,
        color: parsed.data.color,
        icon: parsed.data.icon,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') return actionError('conflict');
      throw error;
    }

    revalidatePath('/categories');
    return actionOk({ categoryId: data.id });
  } catch (error) {
    logger.error('categories.createCategory', { error });
    return actionError('unknown');
  }
}
