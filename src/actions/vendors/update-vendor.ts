'use server';

import { revalidatePath } from 'next/cache';
import { UpdateVendorSchema } from '@/lib/schemas/vendor';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function updateVendor(input: unknown): Promise<ActionResult> {
  const parsed = UpdateVendorSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input', parsed.error.flatten().fieldErrors);

  try {
    const supabase = await createServerClient();
    const update: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) update.name = parsed.data.name;
    if (parsed.data.contact !== undefined) update.contact = parsed.data.contact;
    if (parsed.data.notes !== undefined) update.notes = parsed.data.notes;

    const { error } = await supabase.from('vendors').update(update).eq('id', parsed.data.id);

    if (error) {
      if (error.code === '23505') return actionError('conflict');
      throw error;
    }

    revalidatePath('/vendors');
    revalidatePath('/expenses');
    return actionOk(undefined);
  } catch (error) {
    logger.error('vendors.updateVendor', { error });
    return actionError('unknown');
  }
}
