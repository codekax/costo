import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Lightweight inline empty state — one line of muted text for empty lists or
 * sections inside a card/panel. For full-page illustrated empties use
 * {@link EmptyState} instead.
 */
export function ListEmpty({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('py-8 text-center text-sm text-muted-foreground', className)}>
      {children}
    </p>
  );
}
