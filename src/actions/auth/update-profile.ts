'use server';

import { revalidatePath } from 'next/cache';
import { UpdateProfileSchema } from '@/lib/schemas/auth';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const parsed = UpdateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  try {
    const supabase = await createServerClient();
    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.locale !== undefined) data.locale = parsed.data.locale;
    if (parsed.data.timezone !== undefined) data.timezone = parsed.data.timezone;

    const { error } = await supabase.auth.updateUser({ data });
    if (error) throw error;

    revalidatePath('/', 'layout');
    return actionOk(undefined);
  } catch (error) {
    logger.error('auth.updateProfile', { error });
    return actionError('unknown');
  }
}
