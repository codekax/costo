import { ListSkeleton, PageSkeleton } from '@/components/ui/page-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Expenses loading. Mirrors the page composition:
 *  - PageHeader + 2 actions (Export CSV, Nuevo gasto)
 *  - Scope tabs (Todo / Generales / per-project pills — no border)
 *  - Search input pill + filter pills
 *  - Expense rows (h-16 rounded-2xl matches ExpenseRow exactly)
 */
export default function ExpensesLoading() {
  return (
    <PageSkeleton actions={2}>
      {/* Scope tabs — pure pill row, no underline */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Skeleton className="h-11 w-full rounded-full sm:max-w-md sm:flex-1" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>

      <ListSkeleton rows={8} />
    </PageSkeleton>
  );
}
