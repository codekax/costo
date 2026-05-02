'use server';

import { revalidatePath } from 'next/cache';
import { SendInvitationSchema } from '@/lib/schemas/invitation';
import { createServerClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { InvitationEmail } from '@/lib/email/templates/invitation-email';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

const EXPIRES_IN_DAYS = 7;
const MAX_PENDING_PER_HOUR = 5;

export async function sendInvitation(
  input: unknown,
): Promise<ActionResult<{ invitationId: string; copyLink: string }>> {
  const parsed = SendInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return actionError('invalid_input', parsed.error.flatten().fieldErrors);
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionError('unauthenticated');

    // Workspace + member-count + recent-invites checks (rate limit)
    const [{ data: ws }, { data: members }, { data: recentInvites }] = await Promise.all([
      supabase
        .from('workspaces')
        .select('name, owner_id')
        .eq('id', parsed.data.workspaceId)
        .maybeSingle(),
      supabase
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', parsed.data.workspaceId),
      supabase
        .from('invitations')
        .select('id')
        .eq('workspace_id', parsed.data.workspaceId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
    ]);

    if (!ws) return actionError('not_found');
    if ((members?.length ?? 0) >= 10) return actionError('limit_reached');
    if ((recentInvites?.length ?? 0) >= MAX_PENDING_PER_HOUR) {
      return actionError('limit_reached');
    }

    const expiresAt = new Date(Date.now() + EXPIRES_IN_DAYS * 86400_000).toISOString();

    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: parsed.data.workspaceId,
        email: parsed.data.email,
        role: parsed.data.role,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select('id, token')
      .single();

    if (error) {
      if (error.code === '23505') return actionError('conflict');
      throw error;
    }

    const acceptUrl = `${env.APP_URL}/accept-invitation?token=${invitation.token}`;
    const inviterName =
      (user.user_metadata as { name?: string })?.name ?? user.email ?? 'Alguien';

    // Fire-and-forget email — copy link is the source of truth, email is a convenience
    void sendEmail({
      to: parsed.data.email,
      subject: `Te invitaron a ${ws.name} en costo`,
      react: InvitationEmail({
        workspaceName: ws.name,
        inviterName,
        acceptUrl,
        expiresInDays: EXPIRES_IN_DAYS,
      }),
    });

    revalidatePath(`/settings/workspaces/${parsed.data.workspaceId}/members`);
    return actionOk({ invitationId: invitation.id, copyLink: acceptUrl });
  } catch (error) {
    logger.error('invitations.sendInvitation', { error });
    return actionError('unknown');
  }
}
