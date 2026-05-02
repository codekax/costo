/**
 * @deprecated Use `requireWorkspaceMembership` from `@/lib/workspace-context`.
 * Kept as a thin adapter to preserve the previous return shape used by Server
 * Actions ({ ok: true, supabase, user } | { ok: false, error: ActionResult }).
 */

import 'server-only';

import { actionError, type ActionResult } from '@/actions/_shared';
import {
  requireWorkspaceMembership,
  type WorkspaceMembershipResult,
} from '@/lib/workspace-context';
import type { User } from '@supabase/supabase-js';
import type { createServerClient } from '@/lib/supabase/server';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export async function requireWorkspaceMember(
  workspaceId: string,
): Promise<
  { ok: true; supabase: Db; user: User } | { ok: false; error: ActionResult<never> }
> {
  const result: WorkspaceMembershipResult = await requireWorkspaceMembership(workspaceId);
  if (!result.ok) {
    return { ok: false, error: actionError(result.reason) };
  }
  return { ok: true, supabase: result.supabase, user: result.user };
}
