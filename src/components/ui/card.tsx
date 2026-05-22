import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Apple utility card. Pure white surface, 18px radius (Apple's
 * `{rounded.lg}` for store / accessories grid). Hairline border supplies the
 * separation against the Parchment canvas — no shadow, no gradient. Elevation
 * comes from the canvas-vs-card surface change.
 */
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'flex flex-col gap-5 rounded-[18px] border border-border bg-card py-5 text-card-foreground sm:py-6',
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] sm:px-6 [.border-b]:pb-5',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        // iOS Headline — 17/22 weight 600, conservative size for in-card titles.
        // Page-level titles use <h1> with the LargeTitle scale instead.
        'text-[17px] leading-[1.29] tracking-[-0.02em] [font-weight:600]',
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        // iOS subhead — 15/20 secondaryLabel
        'text-[15px] leading-[1.33] text-muted-foreground [font-weight:400]',
        className,
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-4 sm:px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-4 sm:px-6 [.border-t]:pt-5', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
