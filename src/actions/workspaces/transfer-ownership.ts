'use server';

import { TransferOwnershipSchema } from '@/lib/schemas/workspace';
import {
  actionError,
  actionOk,
  defineAction,
  type ActionResult,
} from '@/actions/_define-action';

const impl = defineAction<typeof TransferOwnershipSchema, void>({
  schema: TransferOwnershipSchema,
  context: 'workspaces.transferOwnership',
  workspaceId: (data) => data.workspaceId,
  revalidate: (data) => [
    `/settings/workspaces/${data.workspaceId}`,
    `/settings/workspaces/${data.workspaceId}/members`,
  ],
  handler: async ({ data, supabase, user, role }) => {
    if (user.id === data.toUserId) return actionError('invalid_input');
    if (role !== 'owner') return actionError('forbidden');

    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', data.workspaceId);

    const target = members?.find((m) => m.user_id === data.toUserId);
    if (!target) return actionError('not_found');

    // Demote current owner → editor, promote target → owner, swap workspaces.owner_id
    const updates = await Promise.all([
      supabase
        .from('workspace_members')
        .update({ role: 'editor' })
        .eq('workspace_id', data.workspaceId)
        .eq('user_id', user.id),
      supabase
        .from('workspace_members')
        .update({ role: 'owner' })
        .eq('workspace_id', data.workspaceId)
        .eq('user_id', data.toUserId),
      supabase
        .from('workspaces')
        .update({ owner_id: data.toUserId })
        .eq('id', data.workspaceId),
    ]);

    const failure = updates.find((u) => u.error);
    if (failure?.error) throw failure.error;
    return actionOk(undefined);
  },
});

export async function transferOwnership(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
