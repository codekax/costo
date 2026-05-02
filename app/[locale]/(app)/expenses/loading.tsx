import { ListSkeleton, PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function ExpensesLoading() {
  return (
    <PageSkeleton actions={2}>
      {/* Scope tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Skeleton className="h-11 w-full max-w-md rounded-full" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <ListSkeleton rows={8} />
    </PageSkeleton>
  );
}
