'use server';

import { revalidatePath } from 'next/cache';
import { SignUpSchema } from '@/lib/schemas/auth';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function signUp(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = SignUpSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: parsed.data.name ? { name: parsed.data.name } : undefined,
      },
    });

    if (error) {
      logger.error('auth.signUp', { error: error.message });
      if (error.message.toLowerCase().includes('already')) return actionError('conflict');
      return actionError('unknown');
    }

    if (!data.user) return actionError('unknown');

    revalidatePath('/', 'layout');
    return actionOk({ userId: data.user.id });
  } catch (error) {
    logger.error('auth.signUp', { error });
    return actionError('unknown');
  }
}
