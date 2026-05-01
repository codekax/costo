'use server';

import { revalidatePath } from 'next/cache';
import { DeleteProjectSchema } from '@/lib/schemas/project';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function deleteProject(input: unknown): Promise<ActionResult> {
  const parsed = DeleteProjectSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  try {
    const supabase = await createServerClient();

    // Verify confirmation matches project name
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', parsed.data.id)
      .maybeSingle();

    if (!project) return actionError('not_found');
    if (project.name !== parsed.data.confirmation) return actionError('invalid_input');

    const { error } = await supabase.from('projects').delete().eq('id', parsed.data.id);
    if (error) throw error;

    revalidatePath('/projects');
    revalidatePath('/dashboard');
    return actionOk(undefined);
  } catch (error) {
    logger.error('projects.deleteProject', { error });
    return actionError('unknown');
  }
}
