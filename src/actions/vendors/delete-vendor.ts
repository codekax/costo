'use server';

import { DeleteVendorSchema } from '@/lib/schemas/vendor';
import { actionError, actionOk, defineAction } from '@/actions/_define-action';

export const deleteVendor = defineAction<typeof DeleteVendorSchema, void>({
  schema: DeleteVendorSchema,
  context: 'vendors.deleteVendor',
  revalidate: ['/vendors', '/expenses'],
  handler: async ({ data, supabase }) => {
    const { data: vendor } = await supabase
      .from('vendors')
      .select('name')
      .eq('id', data.id)
      .maybeSingle();

    if (!vendor) return actionError('not_found');
    if (vendor.name !== data.confirmation) return actionError('invalid_input');

    const { error } = await supabase.from('vendors').delete().eq('id', data.id);
    if (error) throw error;
    return actionOk(undefined);
  },
});
