'use server';

import { MagicLinkSchema } from '@/lib/schemas/auth';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { env } from '@/config/env';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function signInWithMagicLink(input: unknown): Promise<ActionResult> {
  const parsed = MagicLinkSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  try {
    const supabase = await createServerClient();
    const redirectTo = parsed.data.redirectTo ?? `${env.APP_URL}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      logger.error('auth.signInWithMagicLink', { error: error.message });
      return actionError('unknown');
    }

    return actionOk(undefined);
  } catch (error) {
    logger.error('auth.signInWithMagicLink', { error });
    return actionError('unknown');
  }
}
