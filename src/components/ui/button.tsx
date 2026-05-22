import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * Apple-language buttons (single accent, single shape rule):
 *  - default (primary):   Action Blue pill, 17px / 400 SF Pro Text
 *  - secondary:           Action Blue text + 1px border (ghost pill)
 *  - destructive:         Red pill — same geometry, different ink
 *  - outline:             1px ink hairline + transparent fill (low-key utility)
 *  - ghost:               text-only, fills on hover
 *  - link:                inline Action Blue, underline on hover
 *  - dark-utility:        Sign In / Bag style — Ink Black, 8px radius, 14px text
 *
 * Press state is the system-wide `transform: scale(0.95)` micro-interaction.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap outline-none transition-[background-color,opacity,border-color,box-shadow,transform] duration-150 active:scale-[0.97] focus-visible:ring-[2px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 tracking-[-0.022em]",
  {
    variants: {
      variant: {
        default:
          // Transparent border keeps the border-box height pixel-identical to
          // bordered inputs/SelectTriggers — without it the button looks 1-2px
          // shorter when sitting next to a Select.
          'bg-primary text-primary-foreground border border-transparent rounded-full [font-weight:400] hover:brightness-110 active:brightness-95',
        secondary:
          'bg-transparent text-primary border border-primary rounded-full [font-weight:400] hover:bg-primary/[0.06]',
        destructive:
          'bg-destructive text-destructive-foreground border border-transparent rounded-full [font-weight:400] hover:brightness-110 active:brightness-95',
        outline:
          'bg-transparent text-foreground border border-foreground/15 rounded-full [font-weight:400] hover:bg-foreground/[0.04] hover:border-foreground/30',
        ghost:
          'text-foreground rounded-full [font-weight:400] hover:bg-foreground/[0.05]',
        link:
          'text-link underline-offset-4 hover:underline rounded-none [font-weight:400]',
        'dark-utility':
          'bg-foreground text-background rounded-md [font-weight:400] hover:brightness-110 active:brightness-95',
        satellite:
          'bg-secondary text-foreground rounded-full border border-foreground/10 [font-weight:400] hover:bg-foreground/[0.04]',
      },
      size: {
        default: 'h-11 px-[22px] text-[17px] has-[>svg]:px-5',
        xs: 'h-7 gap-1 px-3 text-xs has-[>svg]:px-2.5 [&_svg:not([class*=size-])]:size-3',
        sm: 'h-9 gap-1.5 px-4 text-sm has-[>svg]:px-3.5',
        lg: 'h-12 px-7 text-[18px] has-[>svg]:px-6 [font-weight:300]',
        icon: 'size-11 rounded-full',
        'icon-xs': "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-9 rounded-full',
        'icon-lg': 'size-12 rounded-full',
        satellite: 'size-14 rounded-full [&_svg:not([class*=size-])]:size-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
