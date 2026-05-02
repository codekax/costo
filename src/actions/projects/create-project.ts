'use server';

import { CreateProjectSchema } from '@/lib/schemas/project';
import { actionOk, defineAction, type ActionResult } from '@/actions/_define-action';

const impl = defineAction<typeof CreateProjectSchema, { projectId: string }>({
  schema: CreateProjectSchema,
  context: 'projects.createProject',
  workspaceId: (data) => data.workspaceId,
  revalidate: ['/projects', '/dashboard'],
  handler: async ({ data, supabase }) => {
    const { data: row, error } = await supabase
      .from('projects')
      .insert({
        workspace_id: data.workspaceId,
        name: data.name,
        type: data.type,
        description: data.description ?? null,
        start_date: data.startDate ?? null,
        end_date: data.endDate ?? null,
        budget_ars: data.budgetArs ?? null,
        budget_usd: data.budgetUsd ?? null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return actionOk({ projectId: row.id });
  },
});

export async function createProject(
  input: unknown,
): Promise<ActionResult<{ projectId: string }>> {
  return impl(input);
}
