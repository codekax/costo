import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * iOS-style large title page header. Title scales from 28px (mobile) to
 * 34px (desktop) following Apple HIG LargeTitle. Description uses
 * secondaryLabel gray and 15px size — the canonical Settings/Mail subtitle.
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
        <h1 className="text-[28px] leading-[1.21] tracking-[-0.022em] [font-weight:700] sm:text-[34px]">
          {title}
        </h1>
        {description ? (
          <div className="text-[15px] leading-[1.33] text-muted-foreground [font-weight:400]">
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
