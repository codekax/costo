import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Linear-style page header. Title is the Linear title-3 (20→24px, weight 590,
 * -0.012em) — never the 700 large-title of iOS. Description is 13px tertiary.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <h1 className="text-[20px] leading-[1.33] tracking-[-0.012em] [font-weight:590] sm:text-[24px]">
          {title}
        </h1>
        {description ? (
          <div className="text-[13px] leading-[1.5] text-muted-foreground [font-weight:400]">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
