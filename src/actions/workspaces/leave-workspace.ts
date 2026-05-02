'use server';

import { LeaveWorkspaceSchema } from '@/lib/schemas/workspace';
import {
  actionError,
  actionOk,
  defineAction,
  type ActionResult,
} from '@/actions/_define-action';

const impl = defineAction<typeof LeaveWorkspaceSchema, void>({
  schema: LeaveWorkspaceSchema,
  context: 'workspaces.leaveWorkspace',
  workspaceId: (data) => data.workspaceId,
  revalidate: ['/settings/workspaces', '/'],
  handler: async ({ data, supabase, user }) => {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', data.workspaceId)
      .maybeSingle();

    if (!ws) return actionError('not_found');
    // Owner of a shared workspace cannot leave — must transfer or delete first
    if (ws.owner_id === user.id) return actionError('forbidden');

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', data.workspaceId)
      .eq('user_id', user.id);

    if (error) throw error;
    return actionOk(undefined);
  },
});

export async function leaveWorkspace(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
