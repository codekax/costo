'use server';

import { redirect } from 'next/navigation';
import { DeleteAccountSchema } from '@/lib/schemas/auth';
import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { actionError, type ActionResult } from '@/actions/_shared';

export async function deleteAccount(input: unknown): Promise<ActionResult> {
  const parsed = DeleteAccountSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionError('unauthenticated');

    // Block if user is sole owner of any shared workspace
    const { data: ownedShared } = await supabaseAdmin
      .from('workspaces')
      .select('id, name')
      .eq('owner_id', user.id)
      .eq('kind', 'shared');

    if (ownedShared && ownedShared.length > 0) {
      return actionError('forbidden');
    }

    // Delete the auth user — cascade clears membership rows + personal workspace
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      logger.error('auth.deleteAccount.adminDelete', { error });
      return actionError('unknown');
    }

    await supabase.auth.signOut();
  } catch (error) {
    logger.error('auth.deleteAccount', { error });
    return actionError('unknown');
  }

  redirect('/login');
}
