'use server';

import { UpdateProjectSchema } from '@/lib/schemas/project';
import {
  actionError,
  actionOk,
  defineAction,
  type ActionResult,
} from '@/actions/_define-action';

const impl = defineAction<typeof UpdateProjectSchema, void>({
  schema: UpdateProjectSchema,
  context: 'projects.updateProject',
  revalidate: (data) => [`/projects/${data.id}`, '/projects'],
  handler: async ({ data, supabase }) => {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.type !== undefined) update.type = data.type;
    if (data.description !== undefined) update.description = data.description;
    if (data.startDate !== undefined) update.start_date = data.startDate;
    if (data.endDate !== undefined) update.end_date = data.endDate;
    if (data.budgetArs !== undefined) update.budget_ars = data.budgetArs;
    if (data.budgetUsd !== undefined) update.budget_usd = data.budgetUsd;

    const { data: row, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', data.id)
      .eq('updated_at', data.etag)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!row) return actionError('stale');
    return actionOk(undefined);
  },
});

export async function updateProject(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
