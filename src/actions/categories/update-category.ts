'use server';

import { UpdateCategorySchema } from '@/lib/schemas/category';
import { actionError, actionOk, defineAction } from '@/actions/_define-action';

export const updateCategory = defineAction<typeof UpdateCategorySchema, void>({
  schema: UpdateCategorySchema,
  context: 'categories.updateCategory',
  revalidate: ['/categories', '/expenses'],
  handler: async ({ data, supabase }) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.color !== undefined) update.color = data.color;
    if (data.icon !== undefined) update.icon = data.icon;

    const { error } = await supabase.from('categories').update(update).eq('id', data.id);
    if (error) {
      if (error.code === '23505') return actionError('conflict');
      throw error;
    }
    return actionOk(undefined);
  },
});
