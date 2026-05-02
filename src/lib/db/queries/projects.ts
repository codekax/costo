import 'server-only';

import { cache } from 'react';
import type { createServerClient } from '@/lib/supabase/server';
import type { Project } from '@/types/domain';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export type ProjectWithTotals = Project & {
  total_ars: number;
  total_usd: number;
  expense_count: number;
};

export async function getProjects(
  supabase: Db,
  workspaceId: string,
  opts: { archived?: boolean } = {},
): Promise<ProjectWithTotals[]> {
  const archivedFilter = opts.archived ?? false;

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const filtered = (data ?? []).filter((p) =>
    archivedFilter ? p.archived_at !== null : p.archived_at === null,
  );

  if (filtered.length === 0) return [];

  // Fetch aggregates per project
  const ids = filtered.map((p) => p.id);
  const { data: agg, error: aggError } = await supabase
    .from('expenses')
    .select('project_id, amount_ars, amount_usd')
    .in('project_id', ids);

  if (aggError) throw aggError;

  const totals = new Map<string, { ars: number; usd: number; count: number }>();
  for (const row of agg ?? []) {
    if (!row.project_id) continue;
    const t = totals.get(row.project_id) ?? { ars: 0, usd: 0, count: 0 };
    t.ars += Number(row.amount_ars);
    t.usd += Number(row.amount_usd);
    t.count += 1;
    totals.set(row.project_id, t);
  }

  return filtered.map((p) => {
    const t = totals.get(p.id) ?? { ars: 0, usd: 0, count: 0 };
    return { ...p, total_ars: t.ars, total_usd: t.usd, expense_count: t.count };
  });
}

export const getProjectById = cache(async function getProjectById(
  supabase: Db,
  id: string,
): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
});

/**
 * Cached so a project page can call this from multiple components (header
 * stats + chart) without re-running the SUM. Same supabase reference per
 * request → cache hit.
 */
export const getProjectTotals = cache(async function getProjectTotals(
  supabase: Db,
  projectId: string,
): Promise<{ ars: number; usd: number }> {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount_ars, amount_usd')
    .eq('project_id', projectId);

  if (error) throw error;

  let ars = 0;
  let usd = 0;
  for (const row of data ?? []) {
    ars += Number(row.amount_ars);
    usd += Number(row.amount_usd);
  }
  return { ars, usd };
});
