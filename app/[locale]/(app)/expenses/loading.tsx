import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Expenses loading. Mirrors the page: title in the top bar, the filter toolbar
 * (scope + search + filters | export + new), then the data table.
 */
export default function ExpensesLoading() {
  return (
    <PageSkeleton title={false} actions={0}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-44 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="h-9 border-b border-border bg-muted/40" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex h-12 items-center gap-3 border-b border-border px-3 last:border-0"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
