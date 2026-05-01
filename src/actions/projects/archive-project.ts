'use server';

import { revalidatePath } from 'next/cache';
import { ArchiveProjectSchema } from '@/lib/schemas/project';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function archiveProject(input: unknown): Promise<ActionResult> {
  const parsed = ArchiveProjectSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('projects')
      .update({ archived_at: parsed.data.archive ? new Date().toISOString() : null })
      .eq('id', parsed.data.id);

    if (error) throw error;

    revalidatePath('/projects');
    revalidatePath('/projects/archived');
    return actionOk(undefined);
  } catch (error) {
    logger.error('projects.archiveProject', { error });
    return actionError('unknown');
  }
}
