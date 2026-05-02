'use server';

import { RemoveMemberSchema } from '@/lib/schemas/invitation';
import {
  actionError,
  actionOk,
  defineAction,
  type ActionResult,
} from '@/actions/_define-action';

const impl = defineAction<typeof RemoveMemberSchema, void>({
  schema: RemoveMemberSchema,
  context: 'workspaces.removeMember',
  workspaceId: (data) => data.workspaceId,
  revalidate: (data) => [`/settings/workspaces/${data.workspaceId}/members`],
  handler: async ({ data, supabase }) => {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', data.workspaceId)
      .maybeSingle();

    if (!ws) return actionError('not_found');
    if (ws.owner_id === data.userId) return actionError('forbidden');

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', data.workspaceId)
      .eq('user_id', data.userId);

    if (error) throw error;
    return actionOk(undefined);
  },
});

export async function removeMember(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
