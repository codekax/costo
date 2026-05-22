import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard loading state. Mirrors `app/[locale]/(app)/dashboard/page.tsx`
 * one-for-one so hydration replaces shapes in place:
 *  - PageHeader + 1 action (Nuevo gasto)
 *  - PeriodSelector pill row
 *  - InsightsBanner (compact)
 *  - 2× TotalCard (h-40 to fit eyebrow + value + sparkline + delta line)
 *  - QuickAddExpense row (h-32 — form padding included)
 *  - 2× chart card (donut + monthly)
 *  - Projects + TopMovers grid
 *  - Top vendors + recent expenses grid
 */
export default function DashboardLoading() {
  return (
    <PageSkeleton actions={1}>
      {/* Period selector pill toggle */}
      <Skeleton className="h-9 w-72 rounded-full" />

      {/* Insights banner — only renders when triggered, but keep the slot to
          avoid a jump if it appears. */}
      <Skeleton className="h-20 rounded-[18px]" />

      {/* Two KPI cards with sparkline */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-[18px]" />
        <Skeleton className="h-40 rounded-[18px]" />
      </div>

      {/* Quick-add inline form */}
      <Skeleton className="h-32 rounded-[18px]" />

      {/* Category donut + monthly evolution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[420px] rounded-[18px]" />
        <Skeleton className="h-[420px] rounded-[18px]" />
      </div>

      {/* Active projects + top movers */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-72 rounded-[18px]" />
        <Skeleton className="h-72 rounded-[18px]" />
      </div>

      {/* Top vendors + recent expenses */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[360px] rounded-[18px]" />
        <Skeleton className="h-[360px] rounded-[18px]" />
      </div>
    </PageSkeleton>
  );
}
