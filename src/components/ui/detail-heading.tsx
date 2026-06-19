import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Title for entity detail pages (expense, project, workspace). Uses the Linear
 * title-3 scale (20→24px, weight 590) — the same as {@link PageHeader} — so
 * every page title is consistent, replacing the 36px iOS large-title that each
 * detail page used to re-declare inline.
 */
export function DetailHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        'text-[20px] leading-[1.33] tracking-[-0.012em] [font-weight:590] sm:text-[24px]',
        className,
      )}
    >
      {children}
    </h1>
  );
}
