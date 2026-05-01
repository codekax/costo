'use server';

import { revalidatePath } from 'next/cache';
import { DeleteVendorSchema } from '@/lib/schemas/vendor';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function deleteVendor(input: unknown): Promise<ActionResult> {
  const parsed = DeleteVendorSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  try {
    const supabase = await createServerClient();

    const { data: vendor } = await supabase
      .from('vendors')
      .select('name')
      .eq('id', parsed.data.id)
      .maybeSingle();

    if (!vendor) return actionError('not_found');
    if (vendor.name !== parsed.data.confirmation) return actionError('invalid_input');

    const { error } = await supabase.from('vendors').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidatePath('/vendors');
    revalidatePath('/expenses');
    return actionOk(undefined);
  } catch (error) {
    logger.error('vendors.deleteVendor', { error });
    return actionError('unknown');
  }
}
