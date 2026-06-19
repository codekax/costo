import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dashboard loading state. Mirrors `dashboard/page.tsx`: the title lives in the
 * top bar (no in-page heading), then the action row, insights, KPIs, quick-add,
 * the stacked donut + monthly charts, and the projects + recent grid.
 */
export default function DashboardLoading() {
  return (
    <PageSkeleton title={false} actions={0}>
      {/* Action row: period selector + new expense */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-8 w-72 rounded-full" />
        <Skeleton className="h-8 w-32 rounded-full" />
      </div>

      {/* Insights banner slot */}
      <Skeleton className="h-20 rounded-lg" />

      {/* Two KPI cards with sparkline */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>

      {/* Quick-add inline form */}
      <Skeleton className="h-32 rounded-lg" />

      {/* Category donut + monthly evolution (stacked) */}
      <div className="grid gap-4">
        <Skeleton className="h-[420px] rounded-lg" />
        <Skeleton className="h-[420px] rounded-lg" />
      </div>

      {/* Active projects + recent expenses */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </PageSkeleton>
  );
}
