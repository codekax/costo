import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';
import type { ExpenseWithRelations } from '@/types/domain';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export type WorkspaceTotals = { ars: number; usd: number; count: number };

export type CategoryBreakdown = {
  id: string;
  name: string;
  color: string;
  icon: string;
  ars: number;
  usd: number;
  count: number;
};

export type MonthlyPoint = {
  month: string; // YYYY-MM
  ars: number;
  usd: number;
};

export type VendorBreakdown = {
  id: string;
  name: string;
  ars: number;
  usd: number;
  count: number;
};

export type DashboardData = {
  totals: WorkspaceTotals;
  byCategory: CategoryBreakdown[];
  monthly: MonthlyPoint[];
  topVendors: VendorBreakdown[];
  recent: ExpenseWithRelations[];
};

/**
 * Fetches everything the dashboard needs in 2 round trips:
 *  1) all expenses of the last 12 months (with category + vendor + project relations)
 *  2) the 10 most recent expenses (separate to avoid being skewed by 12-month cap when very few)
 *
 * We aggregate in JS rather than via SQL group-by to avoid an extra Postgres function.
 * For workspaces with up to ~5000 expenses (constitution scale ceiling), this stays under 1 MB.
 */
export async function getDashboardData(
  supabase: Db,
  workspaceId: string,
): Promise<DashboardData> {
  const fromDate = startOfMonthMonthsAgo(12);

  const [windowed, recent] = await Promise.all([
    supabase
      .from('expenses')
      .select(
        `id, amount_ars, amount_usd, paid_at, category_id, vendor_id,
         category:categories!inner(id, name, color, icon),
         vendor:vendors(id, name)`,
      )
      .eq('workspace_id', workspaceId)
      .gte('paid_at', fromDate),
    supabase
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
      .limit(10),
  ]);

  if (windowed.error) throw windowed.error;
  if (recent.error) throw recent.error;

  type WindowRow = {
    id: string;
    amount_ars: number | string;
    amount_usd: number | string;
    paid_at: string;
    category_id: string;
    vendor_id: string | null;
    category: { id: string; name: string; color: string; icon: string };
    vendor: { id: string; name: string } | null;
  };

  const rows = (windowed.data ?? []) as unknown as WindowRow[];

  // Totals (same window — for full workspace totals use getWorkspaceTotals)
  let totalArs = 0;
  let totalUsd = 0;

  // By category
  const catMap = new Map<string, CategoryBreakdown>();

  // By vendor
  const venMap = new Map<string, VendorBreakdown>();

  // By month — initialize empty months so the chart shows continuity
  const monthMap = new Map<string, MonthlyPoint>();
  for (let i = 11; i >= 0; i--) {
    const m = monthKeyMonthsAgo(i);
    monthMap.set(m, { month: m, ars: 0, usd: 0 });
  }

  for (const row of rows) {
    const ars = Number(row.amount_ars);
    const usd = Number(row.amount_usd);
    totalArs += ars;
    totalUsd += usd;

    // Category
    const cat = catMap.get(row.category.id) ?? {
      id: row.category.id,
      name: row.category.name,
      color: row.category.color,
      icon: row.category.icon,
      ars: 0,
      usd: 0,
      count: 0,
    };
    cat.ars += ars;
    cat.usd += usd;
    cat.count += 1;
    catMap.set(row.category.id, cat);

    // Vendor
    if (row.vendor) {
      const ven = venMap.get(row.vendor.id) ?? {
        id: row.vendor.id,
        name: row.vendor.name,
        ars: 0,
        usd: 0,
        count: 0,
      };
      ven.ars += ars;
      ven.usd += usd;
      ven.count += 1;
      venMap.set(row.vendor.id, ven);
    }

    // Month
    const monthKey = row.paid_at.slice(0, 7); // YYYY-MM
    const point = monthMap.get(monthKey);
    if (point) {
      point.ars += ars;
      point.usd += usd;
    }
  }

  const byCategory = [...catMap.values()].sort((a, b) => b.ars + b.usd - (a.ars + a.usd));
  const topVendors = [...venMap.values()]
    .sort((a, b) => b.ars + b.usd - (a.ars + a.usd))
    .slice(0, 5);
  const monthly = [...monthMap.values()];

  return {
    totals: { ars: totalArs, usd: totalUsd, count: rows.length },
    byCategory,
    monthly,
    topVendors,
    recent: (recent.data ?? []) as unknown as ExpenseWithRelations[],
  };
}

function startOfMonthMonthsAgo(months: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

function monthKeyMonthsAgo(months: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 7);
}
