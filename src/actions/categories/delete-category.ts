'use server';

import { DeleteCategorySchema } from '@/lib/schemas/category';
import { actionError, actionOk, defineAction } from '@/actions/_define-action';

export const deleteCategory = defineAction<typeof DeleteCategorySchema, void>({
  schema: DeleteCategorySchema,
  context: 'categories.deleteCategory',
  revalidate: ['/categories', '/expenses', '/dashboard'],
  handler: async ({ data, supabase }) => {
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', data.id)
      .maybeSingle();

    if (!category) return actionError('not_found');
    if (category.name !== data.confirmation) return actionError('invalid_input');

    const { error } = await supabase.from('categories').delete().eq('id', data.id);
    if (error) throw error;
    return actionOk(undefined);
  },
});
