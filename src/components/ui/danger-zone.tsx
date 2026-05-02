import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Danger Zone wrapper — destructive operations (delete account, leave / delete
 * workspace, etc.). Provides the consistent visual treatment for irreversible
 * actions.
 */
export function DangerZone({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('border-destructive/40 bg-destructive/[0.03]', className)}>
      <CardHeader>
        <CardTitle className="text-xl tracking-[-0.4px] text-destructive [font-weight:500]">
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function DangerActionRow({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-base">
        <p className="[font-weight:500]">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground [font-weight:450]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
