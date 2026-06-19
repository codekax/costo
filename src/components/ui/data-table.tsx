import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Rounded, hairline-bordered container for a {@link Table} — the Linear
 * "data table" panel. Clips row hover/dividers to the rounded corners.
 */
export function DataTable({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      {children}
    </div>
  );
}
