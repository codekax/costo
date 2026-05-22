import { z } from 'zod';

/**
 * Dashboard period. Rolling N days (calendar-aware would add complexity
 * without much win for an MVP). `all` skips the previous-period delta —
 * there's no comparison baseline.
 */
export const DASHBOARD_PERIODS = ['month', '3m', '6m', 'year', 'all'] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const DashboardPeriodSchema = z.enum(DASHBOARD_PERIODS).catch('3m');

const PERIOD_DAYS: Record<Exclude<DashboardPeriod, 'all'>, number> = {
  month: 30,
  '3m': 90,
  '6m': 180,
  year: 365,
};

export type DateRange = { from: string; to: string };

function offsetDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseDashboardPeriod(raw: string | undefined | null): DashboardPeriod {
  // .catch('3m') already covers invalid enum values, but `parse(undefined)`
  // still throws (no catch wraps the path validation). Coerce here so callers
  // can pass `searchParams.period` directly.
  return DashboardPeriodSchema.parse(raw ?? '3m');
}

/**
 * Returns the current range and the immediately preceding range of equal
 * length. `prevRange` is null for `all` (no baseline to compare against).
 */
export function getDashboardPeriodRange(
  period: DashboardPeriod,
  today: Date = new Date(),
): { range: DateRange; prevRange: DateRange | null } {
  const to = toIso(today);
  if (period === 'all') {
    return { range: { from: '0001-01-01', to }, prevRange: null };
  }
  const days = PERIOD_DAYS[period];
  const from = offsetDays(today, -days + 1);
  const prevTo = offsetDays(from, -1);
  const prevFrom = offsetDays(prevTo, -days + 1);
  return {
    range: { from: toIso(from), to },
    prevRange: { from: toIso(prevFrom), to: toIso(prevTo) },
  };
}
