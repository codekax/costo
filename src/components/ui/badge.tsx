import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * iOS-style badge / status pill. All variants share the rounded-full shape
 * and small caps-style typography. Tinted variants use a soft background
 * (`--status-*`) + a saturated label color — the canonical Apple pattern
 * used in Reminders, Wallet, Mail status indicators.
 *
 *   default     → ink chip on light surface (category labels)
 *   secondary   → softer fill for use inside cards
 *   outline     → hairline outline only
 *   destructive → solid red (rare; only for truly destructive states)
 *   success / warning / danger / info → tinted iOS status pills
 *   ghost / link / eyebrow → text-only variants
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[11px] leading-none [font-weight:600] tracking-[-0.01em] whitespace-nowrap transition-[color,background-color,box-shadow] focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:opacity-90',
        secondary: 'bg-muted text-foreground [a&]:hover:bg-foreground/5',
        outline: 'border-border text-foreground [a&]:hover:bg-foreground/5',
        destructive:
          'bg-destructive text-destructive-foreground [a&]:hover:brightness-110',
        success: 'bg-status-success text-status-success-foreground',
        warning: 'bg-status-warning text-status-warning-foreground',
        danger: 'bg-status-danger text-status-danger-foreground',
        info: 'bg-status-info text-status-info-foreground',
        ghost: 'bg-transparent text-foreground [a&]:hover:bg-foreground/5',
        link: 'text-link underline-offset-4 [a&]:hover:underline',
        eyebrow:
          'bg-transparent text-muted-foreground border-0 px-0 text-[11px] [font-weight:600] uppercase tracking-[0.04em]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
