import type { ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Standard empty-state card. Replaces the duplicated
 * `<Card><CardContent class="flex flex-col items-center gap-4 py-12 text-center">…</CardContent></Card>`
 * pattern across /expenses, /projects, /import, /dashboard, etc.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon | ComponentType<{ className?: string }>;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className={cn('flex flex-col items-center gap-6 py-24 text-center')}>
        {/* Circular portrait treatment — icon orbits inside a cream-tinted circle */}
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <Icon className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-2 max-w-md">
          <p className="text-2xl tracking-[-0.48px] [font-weight:500]">{title}</p>
          {description ? (
            <p className="text-base text-muted-foreground [font-weight:450]">{description}</p>
          ) : null}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
