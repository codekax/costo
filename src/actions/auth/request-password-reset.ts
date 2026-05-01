'use server';

import { RequestPasswordResetSchema } from '@/lib/schemas/auth';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { env } from '@/config/env';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function requestPasswordReset(input: unknown): Promise<ActionResult> {
  const parsed = RequestPasswordResetSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${env.APP_URL}/auth/callback?reset=1`,
    });

    if (error) {
      logger.error('auth.requestPasswordReset', { error: error.message });
      return actionError('unknown');
    }

    return actionOk(undefined);
  } catch (error) {
    logger.error('auth.requestPasswordReset', { error });
    return actionError('unknown');
  }
}
