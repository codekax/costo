'use server';

import { CreateCategorySchema } from '@/lib/schemas/category';
import {
  actionError,
  actionOk,
  defineAction,
  type ActionResult,
} from '@/actions/_define-action';

const impl = defineAction<typeof CreateCategorySchema, { categoryId: string }>({
  schema: CreateCategorySchema,
  context: 'categories.createCategory',
  workspaceId: (data) => data.workspaceId,
  revalidate: ['/categories'],
  handler: async ({ data, supabase }) => {
    const { data: row, error } = await supabase
      .from('categories')
      .insert({
        workspace_id: data.workspaceId,
        name: data.name,
        color: data.color,
        icon: data.icon,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') return actionError('conflict');
      throw error;
    }
    return actionOk({ categoryId: row.id });
  },
});

// Wrap in an explicit async function declaration so Next.js's `'use server'`
// bundler reliably recognises it as a server action.
export async function createCategory(
  input: unknown,
): Promise<ActionResult<{ categoryId: string }>> {
  return impl(input);
}
