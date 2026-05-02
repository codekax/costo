'use server';

import { revalidatePath } from 'next/cache';

import { RevokeInvitationSchema } from '@/lib/schemas/invitation';
import {
  actionError,
  actionOk,
  defineAction,
  type ActionResult,
} from '@/actions/_define-action';

/**
 * Workspace path is discoverable only AFTER the SELECT — call revalidatePath
 * manually inside the handler.
 */
const impl = defineAction<typeof RevokeInvitationSchema, void>({
  schema: RevokeInvitationSchema,
  context: 'invitations.revokeInvitation',
  handler: async ({ data, supabase }) => {
    const { data: invitation } = await supabase
      .from('invitations')
      .select('workspace_id')
      .eq('id', data.invitationId)
      .maybeSingle();

    if (!invitation) return actionError('not_found');

    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', data.invitationId);

    if (error) throw error;

    revalidatePath(`/settings/workspaces/${invitation.workspace_id}/members`);
    return actionOk(undefined);
  },
});

export async function revokeInvitation(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
