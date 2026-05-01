'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function signOut(): Promise<void> {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    revalidatePath('/', 'layout');
  } catch (error) {
    logger.error('auth.signOut', { error });
  }
  redirect('/login');
}
