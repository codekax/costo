'use server';

import { UpdateVendorSchema } from '@/lib/schemas/vendor';
import { actionError, actionOk, defineAction } from '@/actions/_define-action';

export const updateVendor = defineAction<typeof UpdateVendorSchema, void>({
  schema: UpdateVendorSchema,
  context: 'vendors.updateVendor',
  revalidate: ['/vendors', '/expenses'],
  handler: async ({ data, supabase }) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.contact !== undefined) update.contact = data.contact;
    if (data.notes !== undefined) update.notes = data.notes;

    const { error } = await supabase.from('vendors').update(update).eq('id', data.id);
    if (error) {
      if (error.code === '23505') return actionError('conflict');
      throw error;
    }
    return actionOk(undefined);
  },
});
