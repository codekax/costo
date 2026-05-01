'use server';

import { revalidatePath } from 'next/cache';
import { CreateVendorSchema } from '@/lib/schemas/vendor';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import { requireWorkspaceMember } from '@/actions/_workspace-guard';

export async function createVendor(
  input: unknown,
): Promise<ActionResult<{ vendorId: string; name: string }>> {
  const parsed = CreateVendorSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  const guard = await requireWorkspaceMember(parsed.data.workspaceId);
  if (!guard.ok) return guard.error;

  try {
    const { data, error } = await guard.supabase
      .from('vendors')
      .insert({
        workspace_id: parsed.data.workspaceId,
        name: parsed.data.name,
        contact: parsed.data.contact ?? null,
        notes: parsed.data.notes ?? null,
      })
      .select('id, name')
      .single();

    if (error) {
      if (error.code === '23505') return actionError('conflict');
      throw error;
    }

    revalidatePath('/vendors');
    return actionOk({ vendorId: data.id, name: data.name });
  } catch (error) {
    logger.error('vendors.createVendor', { error });
    return actionError('unknown');
  }
}
