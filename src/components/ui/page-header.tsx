import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Standard top-of-page header. Replaces the
 * `<div className="flex items-center justify-between"><h1>…</h1>…</div>`
 * pattern duplicated across all (app) pages.
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
        'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {/* Mastercard H2 scale: 36px / weight 500 / -2% tracking — editorial section title.
            Scales down on mobile so it doesn't dominate the viewport. */}
        <h1 className="text-2xl leading-[1.15] tracking-[-0.5px] [font-weight:500] sm:text-3xl sm:leading-[1.18] sm:tracking-[-0.6px] lg:text-[36px] lg:leading-[1.22] lg:tracking-[-0.72px]">
          {title}
        </h1>
        {description ? (
          <div className="text-sm text-muted-foreground [font-weight:450] sm:text-base">
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
