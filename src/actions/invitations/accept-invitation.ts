'use server';

import { revalidatePath } from 'next/cache';
import { AcceptInvitationSchema } from '@/lib/schemas/invitation';
import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { setActiveWorkspaceCookie } from '@/lib/active-workspace';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

/**
 * Accepts an invitation. Requires the user to be authenticated with the
 * email matching the invitation. Uses service-role client to bootstrap the
 * membership row because RLS on workspace_members blocks non-members from
 * inserting (chicken-and-egg).
 */
export async function acceptInvitation(
  input: unknown,
): Promise<ActionResult<{ workspaceId: string }>> {
  const parsed = AcceptInvitationSchema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) return actionError('unauthenticated');

    // Read the invitation via admin (RLS on invitations would block a non-member)
    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .select('id, workspace_id, email, role, expires_at, accepted_at')
      .eq('token', parsed.data.token)
      .maybeSingle();

    if (error) throw error;
    if (!invitation) return actionError('not_found');
    if (invitation.accepted_at) return actionError('not_found');
    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      return actionError('expired');
    }
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return actionError('forbidden');
    }

    // Membership cap check (defense in depth — DB trigger also enforces 10)
    const { data: members } = await supabaseAdmin
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', invitation.workspace_id);

    if ((members?.length ?? 0) >= 10) return actionError('limit_reached');
    if (members?.some((m) => m.user_id === user.id)) {
      // Already a member — just consume the invitation
      await supabaseAdmin
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);
      await setActiveWorkspaceCookie(invitation.workspace_id);
      return actionOk({ workspaceId: invitation.workspace_id });
    }

    const inserts = await Promise.all([
      supabaseAdmin.from('workspace_members').insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: null,
      }),
      supabaseAdmin
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id),
    ]);

    const failure = inserts.find((r) => r.error);
    if (failure?.error) throw failure.error;

    await setActiveWorkspaceCookie(invitation.workspace_id);
    revalidatePath('/', 'layout');
    return actionOk({ workspaceId: invitation.workspace_id });
  } catch (error) {
    logger.error('invitations.acceptInvitation', { error });
    return actionError('unknown');
  }
}
