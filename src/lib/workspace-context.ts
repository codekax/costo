/**
 * Workspace context — the single source of truth for "who is logged in,
 * which workspace are they currently in, what role do they have?"
 *
 * Used by:
 *  - app/[locale]/(app)/layout.tsx (server component, redirects if missing)
 *  - Server pages that need workspace data
 *  - Server Actions that mutate workspace-scoped resources
 *
 * Wrapped in React `cache()` so all callers in the same request share a single
 * resolution. Reading auth + cookie + workspace + role costs one round trip.
 */

import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserWorkspaces, type WorkspaceWithRole } from '@/lib/db/queries/workspaces';
import { ACTIVE_WORKSPACE_COOKIE } from '@/constants/workspaces';
import type { WorkspaceRole } from '@/types/domain';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export type WorkspaceContext = {
  user: User;
  workspace: WorkspaceWithRole;
  role: WorkspaceRole;
  workspaces: WorkspaceWithRole[];
  supabase: Db;
};

/**
 * Resolve the workspace context for the current request, or `null` if the
 * user is unauthenticated / has no workspaces yet.
 *
 * Components or actions that **require** auth+workspace should call
 * `requireWorkspaceContext()` instead, which redirects on absence.
 */
export const getWorkspaceContext = cache(async (): Promise<WorkspaceContext | null> => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const workspaces = await getCurrentUserWorkspaces(supabase);
  if (workspaces.length === 0) return null;

  const cookieStore = await cookies();
  const stored = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const workspace = (stored && workspaces.find((w) => w.id === stored)) || workspaces[0];
  if (!workspace) return null;

  return { user, workspace, role: workspace.role, workspaces, supabase };
});

/**
 * Same as `getWorkspaceContext` but redirects on absence:
 *  - no user → /login
 *  - user but no workspaces → /onboarding (TODO: not implemented; falls back to /login)
 */
export async function requireWorkspaceContext(): Promise<WorkspaceContext> {
  const ctx = await getWorkspaceContext();
  if (!ctx) redirect('/login');
  return ctx;
}

/**
 * Action-side: ensure the caller is authenticated AND a member of the given
 * workspace. Returns supabase + user on success, an action error on failure.
 *
 * Lighter than the page-level context (no need to load all workspaces).
 */
export type WorkspaceMembershipResult =
  | {
      ok: true;
      supabase: Db;
      user: User;
      role: WorkspaceRole;
    }
  | {
      ok: false;
      reason: 'unauthenticated' | 'forbidden' | 'unknown';
    };

export const requireWorkspaceMembership = cache(
  async (workspaceId: string): Promise<WorkspaceMembershipResult> => {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, reason: 'unauthenticated' };

    const { data, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return { ok: false, reason: 'unknown' };
    if (!data) return { ok: false, reason: 'forbidden' };
    return { ok: true, supabase, user, role: data.role };
  },
);

/**
 * Persist the active workspace selection. Called by the WorkspaceSwitcher.
 */
export async function setActiveWorkspaceCookie(workspaceId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
