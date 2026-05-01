import 'server-only';

import { createServerClient } from '@/lib/supabase/server';
import { actionError, type ActionResult } from '@/actions/_shared';
import type { User } from '@supabase/supabase-js';

type Db = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Helper: ensures the caller is authenticated and a member of the workspace.
 * Returns the supabase client + user for chaining inside Server Actions.
 */
export async function requireWorkspaceMember(
  workspaceId: string,
): Promise<
  | { ok: true; supabase: Db; user: User }
  | { ok: false; error: ActionResult<never> }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: actionError('unauthenticated') };
  }

  const { data, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return { ok: false, error: actionError('unknown') };
  if (!data) return { ok: false, error: actionError('forbidden') };

  return { ok: true, supabase, user };
}
