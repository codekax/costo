import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Page-level skeleton primitive matching the PageHeader / Card / Row shapes.
 *
 * The dimensions here intentionally mirror their loaded counterparts so the
 * layout doesn't reflow on hydration:
 *  - Title  : 36 → 40px tall (h1 28/34px + leading)
 *  - Action : 44px tall pill (Button h-11 rounded-full)
 *  - Card   : 18px radius (Apple `{rounded.lg}` utility card)
 *  - Row    : 24px radius (ExpenseRow rounded-2xl)
 */
export function PageSkeleton({
  actions = 1,
  description = true,
  children,
  className,
}: {
  actions?: number;
  description?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44 sm:h-10 sm:w-56" />
          {description ? <Skeleton className="h-4 w-56 sm:w-72" /> : null}
        </div>
        {actions > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: actions }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-11 w-32 rounded-full sm:w-36"
              />
            ))}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * Stacked rows — for expense, vendor, category lists. Matches ExpenseRow
 * (h-16, rounded-2xl) so the swap-in is invisible.
 */
export function ListSkeleton({
  rows = 6,
  rowClassName = 'h-16 rounded-2xl',
}: {
  rows?: number;
  rowClassName?: string;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={rowClassName} />
      ))}
    </div>
  );
}

/**
 * Card grid — for project / vendor / category tiles. Matches Card primitive
 * (rounded-[18px]).
 */
export function GridSkeleton({
  count = 6,
  cardClassName = 'h-56 rounded-[18px]',
  cols = 'sm:grid-cols-2 lg:grid-cols-3',
}: {
  count?: number;
  cardClassName?: string;
  cols?: string;
}) {
  return (
    <div className={cn('grid gap-4', cols)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cardClassName} />
      ))}
    </div>
  );
}
