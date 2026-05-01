import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';
import type { Workspace, WorkspaceRole } from '@/types/domain';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export type WorkspaceWithRole = Workspace & { role: WorkspaceRole };

type MemberRow = {
  role: WorkspaceRole;
  workspaces: Workspace;
};

export async function getCurrentUserWorkspaces(supabase: Db): Promise<WorkspaceWithRole[]> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role, workspaces!inner(*)')
    .order('joined_at', { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as unknown as MemberRow[];
  return rows.map((row) => ({ ...row.workspaces, role: row.role }));
}

export async function getWorkspaceById(
  supabase: Db,
  id: string,
): Promise<WorkspaceWithRole | null> {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role, workspaces!inner(*)')
    .eq('workspace_id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as MemberRow;
  return { ...row.workspaces, role: row.role };
}
