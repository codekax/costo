import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';
import type { ExpenseWithRelations } from '@/types/domain';
import type { ExpenseFilters } from '@/lib/schemas/expense';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export async function getExpenses(
  supabase: Db,
  workspaceId: string,
  filters: ExpenseFilters = {},
  limit = 100,
): Promise<ExpenseWithRelations[]> {
  let query = supabase
    .from('expenses')
    .select(
      `*,
       project:projects(id, name),
       category:categories!inner(id, name, color, icon),
       vendor:vendors(id, name)`,
    )
    .eq('workspace_id', workspaceId)
    .order('paid_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters.projectId !== undefined) {
    query = filters.projectId === null ? query.is('project_id', null) : query.eq('project_id', filters.projectId);
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.vendorId) query = query.eq('vendor_id', filters.vendorId);
  if (filters.currency) query = query.eq('currency', filters.currency);
  if (filters.dateFrom) query = query.gte('paid_at', filters.dateFrom);
  if (filters.dateTo) query = query.lte('paid_at', filters.dateTo);
  if (filters.search) query = query.textSearch('description', filters.search, { type: 'plain' });

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as unknown as ExpenseWithRelations[];
}

export async function getExpenseById(
  supabase: Db,
  id: string,
): Promise<ExpenseWithRelations | null> {
  const { data, error } = await supabase
    .from('expenses')
    .select(
      `*,
       project:projects(id, name),
       category:categories!inner(id, name, color, icon),
       vendor:vendors(id, name)`,
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as ExpenseWithRelations) ?? null;
}

export async function getWorkspaceTotals(
  supabase: Db,
  workspaceId: string,
): Promise<{ ars: number; usd: number; count: number }> {
  const { data, error } = await supabase
    .from('expenses')
    .select('amount_ars, amount_usd')
    .eq('workspace_id', workspaceId);

  if (error) throw error;

  let ars = 0;
  let usd = 0;
  for (const row of data ?? []) {
    ars += Number(row.amount_ars);
    usd += Number(row.amount_usd);
  }
  return { ars, usd, count: data?.length ?? 0 };
}
