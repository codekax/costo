'use server';

import { UpdateWorkspaceSchema } from '@/lib/schemas/workspace';
import { actionOk, defineAction, type ActionResult } from '@/actions/_define-action';

const impl = defineAction<typeof UpdateWorkspaceSchema, void>({
  schema: UpdateWorkspaceSchema,
  context: 'workspaces.updateWorkspace',
  workspaceId: (data) => data.id,
  revalidate: (data) => [
    '/settings/workspaces',
    `/settings/workspaces/${data.id}`,
    '/',
  ],
  handler: async ({ data, supabase }) => {
    const { error } = await supabase
      .from('workspaces')
      .update({ name: data.name })
      .eq('id', data.id);

    if (error) throw error;
    return actionOk(undefined);
  },
});

export async function updateWorkspace(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
