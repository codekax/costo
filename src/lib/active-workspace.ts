import 'server-only';

import { cookies } from 'next/headers';
import { getCurrentUserWorkspaces, type WorkspaceWithRole } from '@/lib/db/queries/workspaces';
import { createServerClient } from '@/lib/supabase/server';

const COOKIE_NAME = 'active_workspace_id';

export async function getActiveWorkspace(): Promise<{
  active: WorkspaceWithRole;
  all: WorkspaceWithRole[];
} | null> {
  const supabase = await createServerClient();
  const all = await getCurrentUserWorkspaces(supabase);
  if (all.length === 0) return null;

  const cookieStore = await cookies();
  const stored = cookieStore.get(COOKIE_NAME)?.value;
  const active = (stored && all.find((w) => w.id === stored)) || all[0];
  if (!active) return null;

  return { active, all };
}

export async function setActiveWorkspaceCookie(workspaceId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, workspaceId, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
