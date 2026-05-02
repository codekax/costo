import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { WorkspaceRole } from '@/types/domain';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export type WorkspaceMemberInfo = {
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  email: string | null;
  display_name: string | null;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: WorkspaceRole;
  expires_at: string;
  created_at: string;
};

export async function getWorkspaceMembers(
  supabase: Db,
  workspaceId: string,
): Promise<WorkspaceMemberInfo[]> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('user_id, role, joined_at')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // auth.users is not exposed via PostgREST — use admin to enrich with email/name
  const enriched = await Promise.all(
    data.map(async (m) => {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(m.user_id);
      const u = userData?.user;
      const meta = (u?.user_metadata ?? {}) as { name?: string };
      return {
        user_id: m.user_id,
        role: m.role as WorkspaceRole,
        joined_at: m.joined_at,
        email: u?.email ?? null,
        display_name: meta.name ?? null,
      };
    }),
  );

  return enriched;
}

export async function getPendingInvitations(
  supabase: Db,
  workspaceId: string,
): Promise<PendingInvitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('id, email, role, expires_at, created_at')
    .eq('workspace_id', workspaceId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PendingInvitation[];
}
