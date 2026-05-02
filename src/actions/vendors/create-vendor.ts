'use server';

import { CreateVendorSchema } from '@/lib/schemas/vendor';
import { actionError, actionOk, defineAction } from '@/actions/_define-action';

export const createVendor = defineAction<
  typeof CreateVendorSchema,
  { vendorId: string; name: string }
>({
  schema: CreateVendorSchema,
  context: 'vendors.createVendor',
  workspaceId: (data) => data.workspaceId,
  revalidate: ['/vendors'],
  handler: async ({ data, supabase }) => {
    const { data: row, error } = await supabase
      .from('vendors')
      .insert({
        workspace_id: data.workspaceId,
        name: data.name,
        contact: data.contact ?? null,
        notes: data.notes ?? null,
      })
      .select('id, name')
      .single();

    if (error) {
      if (error.code === '23505') return actionError('conflict');
      throw error;
    }
    return actionOk({ vendorId: row.id, name: row.name });
  },
});
