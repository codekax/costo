import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';
import type { ExpenseWithRelations } from '@/types/domain';
import {
  type DashboardPeriod,
  type DateRange,
  getDashboardPeriodRange,
} from '@/lib/dashboard-period';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export type WorkspaceTotals = { ars: number; usd: number; count: number };

export type CategoryBreakdown = {
  id: string;
  name: string;
  color: string;
  icon: string;
  ars: number;
  usd: number;
  prevArs: number;
  prevUsd: number;
  count: number;
};

export type MonthlyPoint = { month: string; ars: number; usd: number };

export type WeeklyPoint = { weekStart: string; ars: number; usd: number };

export type VendorBreakdown = {
  id: string;
  name: string;
  ars: number;
  usd: number;
  count: number;
};

export type Forecast = {
  mtdArs: number;
  mtdUsd: number;
  projectedArs: number;
  projectedUsd: number;
  daysElapsed: number;
  daysInMonth: number;
};

export type DashboardData = {
  period: DashboardPeriod;
  range: DateRange;
  prevRange: DateRange | null;
  totals: WorkspaceTotals;
  prevTotals: WorkspaceTotals | null;
  byCategory: CategoryBreakdown[];
  monthly: MonthlyPoint[];
  weekly: WeeklyPoint[];
  topVendors: VendorBreakdown[];
  recent: ExpenseWithRelations[];
  forecast: Forecast;
};

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

/**
 * Single windowed fetch + JS aggregation. The window covers the widest of:
 *  - selected period + previous period (for delta vs baseline)
 *  - last 12 months (for the monthly chart)
 *  - last 12 weeks (for the sparkline)
 *
 * At workspace scale (≤5k expenses) this stays well under 1 MB even with
 * `period='all'`.
 */
export async function getDashboardData(
  supabase: Db,
  workspaceId: string,
  period: DashboardPeriod,
): Promise<DashboardData> {
  const today = new Date();
  const { range, prevRange } = getDashboardPeriodRange(period, today);

  const monthBoundary = startOfMonthMonthsAgo(today, 12);
  const weekBoundary = isoOffsetDays(today, -7 * 12);
  const candidates = [monthBoundary, weekBoundary];
  if (prevRange) candidates.push(prevRange.from);
  else candidates.push(range.from);
  const fromBound = candidates.sort()[0]!;

  const [windowed, recent] = await Promise.all([
    supabase
      .from('expenses')
      .select(
        `id, amount_ars, amount_usd, paid_at, category_id, vendor_id,
         category:categories!inner(id, name, color, icon),
         vendor:vendors(id, name)`,
      )
      .eq('workspace_id', workspaceId)
      .gte('paid_at', fromBound),
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

  const rows = (windowed.data ?? []) as unknown as WindowRow[];

  const currentTotals: WorkspaceTotals = { ars: 0, usd: 0, count: 0 };
  const prevTotalsBucket: WorkspaceTotals = { ars: 0, usd: 0, count: 0 };
  const catMap = new Map<string, CategoryBreakdown>();
  const venMap = new Map<string, VendorBreakdown>();

  // Monthly chart — initialise 12 months so the chart is continuous
  const monthMap = new Map<string, MonthlyPoint>();
  for (let i = 11; i >= 0; i--) {
    const m = monthKeyMonthsAgo(today, i);
    monthMap.set(m, { month: m, ars: 0, usd: 0 });
  }

  // Sparkline — 12 weekly buckets ending on the most recent Monday
  const weekMap = new Map<string, WeeklyPoint>();
  for (let i = 11; i >= 0; i--) {
    const ws = mondayOfWeekIso(today, -i * 7);
    weekMap.set(ws, { weekStart: ws, ars: 0, usd: 0 });
  }

  // Forecast — current calendar month so far
  const monthStart = isoStartOfMonth(today);
  let mtdArs = 0;
  let mtdUsd = 0;

  for (const row of rows) {
    const ars = Number(row.amount_ars);
    const usd = Number(row.amount_usd);
    const paid = row.paid_at;

    if (paid >= range.from && paid <= range.to) {
      currentTotals.ars += ars;
      currentTotals.usd += usd;
      currentTotals.count += 1;

      const cat = catMap.get(row.category.id) ?? {
        id: row.category.id,
        name: row.category.name,
        color: row.category.color,
        icon: row.category.icon,
        ars: 0,
        usd: 0,
        prevArs: 0,
        prevUsd: 0,
        count: 0,
      };
      cat.ars += ars;
      cat.usd += usd;
      cat.count += 1;
      catMap.set(row.category.id, cat);

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
    }

    if (prevRange && paid >= prevRange.from && paid <= prevRange.to) {
      prevTotalsBucket.ars += ars;
      prevTotalsBucket.usd += usd;
      prevTotalsBucket.count += 1;
      const cat = catMap.get(row.category.id);
      if (cat) {
        cat.prevArs += ars;
        cat.prevUsd += usd;
      } else {
        // Category present only in the previous window — track it so the top-movers
        // list can still surface categories that disappeared this period.
        catMap.set(row.category.id, {
          id: row.category.id,
          name: row.category.name,
          color: row.category.color,
          icon: row.category.icon,
          ars: 0,
          usd: 0,
          prevArs: ars,
          prevUsd: usd,
          count: 0,
        });
      }
    }

    const monthKey = paid.slice(0, 7);
    const monthPoint = monthMap.get(monthKey);
    if (monthPoint) {
      monthPoint.ars += ars;
      monthPoint.usd += usd;
    }

    const weekKey = mondayOfDateIso(paid);
    const weekPoint = weekMap.get(weekKey);
    if (weekPoint) {
      weekPoint.ars += ars;
      weekPoint.usd += usd;
    }

    if (paid >= monthStart) {
      mtdArs += ars;
      mtdUsd += usd;
    }
  }

  const byCategory = [...catMap.values()].sort(
    (a, b) => b.ars + b.usd - (a.ars + a.usd),
  );
  const topVendors = [...venMap.values()]
    .sort((a, b) => b.ars + b.usd - (a.ars + a.usd))
    .slice(0, 5);
  const monthly = [...monthMap.values()];
  const weekly = [...weekMap.values()];

  const daysElapsed = todayDayOfMonth(today);
  const daysInMonth = daysInCurrentMonth(today);
  const factor = daysElapsed > 0 ? daysInMonth / daysElapsed : 0;
  const forecast: Forecast = {
    mtdArs,
    mtdUsd,
    projectedArs: mtdArs * factor,
    projectedUsd: mtdUsd * factor,
    daysElapsed,
    daysInMonth,
  };

  return {
    period,
    range,
    prevRange,
    totals: currentTotals,
    prevTotals: prevRange ? prevTotalsBucket : null,
    byCategory,
    monthly,
    weekly,
    topVendors,
    recent: (recent.data ?? []) as unknown as ExpenseWithRelations[],
    forecast,
  };
}

function startOfMonthMonthsAgo(today: Date, months: number): string {
  const d = new Date(today);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

function monthKeyMonthsAgo(today: Date, months: number): string {
  const d = new Date(today);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 7);
}

function isoOffsetDays(today: Date, days: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoStartOfMonth(today: Date): string {
  const d = new Date(today);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

function todayDayOfMonth(today: Date): number {
  return today.getUTCDate();
}

function daysInCurrentMonth(today: Date): number {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
  return d.getUTCDate();
}

/**
 * Returns the Monday of the ISO week containing the given date, in YYYY-MM-DD.
 * Used both to seed the 12-week bucket map and to bucket each expense row.
 */
function mondayOfDateIso(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sun
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function mondayOfWeekIso(today: Date, daysOffset: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return mondayOfDateIso(d.toISOString().slice(0, 10));
}
