'use server';

import { revalidatePath } from 'next/cache';
import { SignInSchema } from '@/lib/schemas/auth';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function signIn(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = SignInSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      logger.warn('auth.signIn', { error: error.message });
      return actionError('not_found');
    }

    revalidatePath('/', 'layout');
    return actionOk({ redirectTo: '/dashboard' });
  } catch (error) {
    logger.error('auth.signIn', { error });
    return actionError('unknown');
  }
}
