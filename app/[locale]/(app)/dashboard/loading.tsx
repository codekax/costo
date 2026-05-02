import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <PageSkeleton actions={1}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-[480px]" />
    </PageSkeleton>
  );
}
