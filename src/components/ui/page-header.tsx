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
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <div className="min-w-0 space-y-2">
        {/* Mastercard H2 scale: 36px / weight 500 / -2% tracking — editorial section title */}
        <h1 className="text-[36px] leading-[1.22] tracking-[-0.72px] [font-weight:500]">
          {title}
        </h1>
        {description ? (
          <div className="text-base text-muted-foreground [font-weight:450]">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
