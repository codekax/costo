import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Generic fallback for app segments that don't have their own loading.tsx.
 */
export default function AppLoading() {
  return (
    <PageSkeleton actions={1}>
      <Skeleton className="h-72" />
    </PageSkeleton>
  );
}
