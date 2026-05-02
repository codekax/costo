import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * Mastercard-language badge:
 *  - Always pill-shaped (rounded-full) — matches the chip treatment inside cards
 *  - default: white pill with Ink text — the canonical category chip ("Story")
 *  - secondary: Lifted Cream pill with Ink text — softer alternative
 *  - outline: cream pill with Ink hairline border
 *  - destructive: Signal Orange pill with white text — legal/consent visual
 *  - eyebrow: 14px / 700 / +4% tracking, uppercase, with optional accent-dot child
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-3 py-1 text-xs [font-weight:500] whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: 'bg-secondary text-foreground border-foreground/10 [a&]:hover:bg-foreground/5',
        secondary: 'bg-card text-card-foreground [a&]:hover:bg-foreground/5',
        outline: 'border-foreground/20 text-foreground [a&]:hover:bg-foreground/5',
        destructive:
          'bg-destructive text-destructive-foreground focus-visible:ring-destructive [a&]:hover:brightness-110',
        ghost: 'bg-transparent text-foreground [a&]:hover:bg-foreground/5',
        link: 'text-link underline-offset-4 [a&]:hover:underline',
        eyebrow:
          'bg-transparent text-foreground border-0 px-0 text-sm [font-weight:700] uppercase tracking-[0.56px]',
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
