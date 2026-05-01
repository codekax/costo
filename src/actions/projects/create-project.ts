'use server';

import { revalidatePath } from 'next/cache';
import { CreateProjectSchema } from '@/lib/schemas/project';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import { requireWorkspaceMember } from '@/actions/_workspace-guard';

export async function createProject(
  input: unknown,
): Promise<ActionResult<{ projectId: string }>> {
  const parsed = CreateProjectSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  const guard = await requireWorkspaceMember(parsed.data.workspaceId);
  if (!guard.ok) return guard.error;

  try {
    const v = parsed.data;
    const { data, error } = await guard.supabase
      .from('projects')
      .insert({
        workspace_id: v.workspaceId,
        name: v.name,
        type: v.type,
        description: v.description ?? null,
        start_date: v.startDate ?? null,
        end_date: v.endDate ?? null,
        budget_ars: v.budgetArs ?? null,
        budget_usd: v.budgetUsd ?? null,
      })
      .select('id')
      .single();

    if (error) throw error;

    revalidatePath('/projects');
    revalidatePath('/dashboard');
    return actionOk({ projectId: data.id });
  } catch (error) {
    logger.error('projects.createProject', { error });
    return actionError('unknown');
  }
}
