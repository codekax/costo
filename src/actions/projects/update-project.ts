'use server';

import { revalidatePath } from 'next/cache';
import { UpdateProjectSchema } from '@/lib/schemas/project';
import { createServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

export async function updateProject(input: unknown): Promise<ActionResult> {
  const parsed = UpdateProjectSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input', parsed.error.flatten().fieldErrors);

  try {
    const supabase = await createServerClient();
    const v = parsed.data;
    const update: Record<string, unknown> = {};
    if (v.name !== undefined) update.name = v.name;
    if (v.type !== undefined) update.type = v.type;
    if (v.description !== undefined) update.description = v.description;
    if (v.startDate !== undefined) update.start_date = v.startDate;
    if (v.endDate !== undefined) update.end_date = v.endDate;
    if (v.budgetArs !== undefined) update.budget_ars = v.budgetArs;
    if (v.budgetUsd !== undefined) update.budget_usd = v.budgetUsd;

    const { data, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', v.id)
      .eq('updated_at', v.etag)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return actionError('stale');

    revalidatePath(`/projects/${v.id}`);
    revalidatePath('/projects');
    return actionOk(undefined);
  } catch (error) {
    logger.error('projects.updateProject', { error });
    return actionError('unknown');
  }
}
