import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Page-level skeleton primitive. Replaces the duplicated PageHeader-shaped
 * skeleton at the top of every `loading.tsx`. Compose with a body slot for
 * the page-specific content.
 *
 * Usage:
 *   <PageSkeleton actions={2}>
 *     <ListSkeleton rows={8} />
 *   </PageSkeleton>
 */
export function PageSkeleton({
  actions = 1,
  description = true,
  children,
  className,
}: {
  /** Number of action buttons in the header (right side). */
  actions?: number;
  /** Whether to render a description placeholder under the title. */
  description?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          {description ? <Skeleton className="h-4 w-72" /> : null}
        </div>
        {actions > 0 ? (
          <div className="flex gap-2">
            {Array.from({ length: actions }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * Stacked rows — for expense lists, vendor lists, category lists.
 */
export function ListSkeleton({
  rows = 6,
  rowClassName = 'h-16',
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
 * Card grid — for project cards, dashboard tile rows.
 */
export function GridSkeleton({
  count = 6,
  cardClassName = 'h-56',
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
