import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';

type Db = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Distinct project types previously used in this workspace, sorted by frequency
 * desc then alphabetically. Drives the autocomplete suggestions in the project
 * form so the user reuses their own taxonomy.
 */
export async function getProjectTypes(supabase: Db, workspaceId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('type')
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (typeof row.type !== 'string') continue;
    const t = row.type.trim();
    if (!t) continue;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name);
}
