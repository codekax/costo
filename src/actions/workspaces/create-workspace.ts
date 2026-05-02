'use server';

import { CreateWorkspaceSchema } from '@/lib/schemas/workspace';
import { actionOk, defineAction, type ActionResult } from '@/actions/_define-action';

const impl = defineAction<typeof CreateWorkspaceSchema, { workspaceId: string }>({
  schema: CreateWorkspaceSchema,
  context: 'workspaces.createWorkspace',
  // No workspaceId in schema — falls back to getWorkspaceContext for auth.
  revalidate: ['/settings/workspaces', '/'],
  handler: async ({ data, supabase, user }) => {
    const { data: row, error } = await supabase
      .from('workspaces')
      .insert({ name: data.name, kind: 'shared', owner_id: user.id })
      .select('id')
      .single();

    if (error) throw error;
    return actionOk({ workspaceId: row.id });
  },
});

export async function createWorkspace(
  input: unknown,
): Promise<ActionResult<{ workspaceId: string }>> {
  return impl(input);
}
