import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * Mastercard-language buttons (productivity radii):
 *  - Primary "Ink": Ink Black bg + Canvas Cream text + 1.5px ink border
 *  - Secondary "Outlined": White bg + Ink text + 1.5px ink border
 *  - Destructive: Signal Orange (#CF4500) bg + white text — consent/legal color
 *  - Outline: transparent + ink border (lighter weight than secondary)
 *  - Ghost: transparent + subtle hover
 *  - Link: deep dusty blue with underline-offset
 *  - Satellite: perfect circle (rounded-full) with ink arrow icon
 *  - Icon sizes use rounded-full to keep the pill / portrait gesture
 *  - All sized variants share rounded-md (productivity radius), -2% tracking
 *  - Hover communicates state through brightness/opacity, never color shift
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md whitespace-nowrap outline-none transition-[background-color,opacity,border-color,box-shadow] duration-150 focus-visible:ring-[2px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 tracking-[-0.32px]",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-[1.5px] border-primary [font-weight:500] hover:brightness-110 active:brightness-90',
        secondary:
          'bg-secondary text-secondary-foreground border-[1.5px] border-foreground [font-weight:450] hover:bg-foreground/5',
        destructive:
          // Consent/legal pill — Mastercard uses 24px (rounded-lg) for orange consent buttons
          'bg-destructive text-destructive-foreground rounded-lg [font-weight:500] hover:brightness-110 active:brightness-90',
        outline:
          'bg-transparent text-foreground border-[1.5px] border-foreground/40 [font-weight:450] hover:border-foreground hover:bg-foreground/5',
        ghost: 'text-foreground [font-weight:500] hover:bg-foreground/5',
        link: 'text-link underline-offset-4 hover:underline rounded-none [font-weight:500]',
        satellite:
          'bg-secondary text-foreground rounded-full border-0 shadow-sm [font-weight:500] hover:brightness-110 active:brightness-90',
      },
      size: {
        default: 'h-10 px-6 text-base has-[>svg]:px-5',
        xs: 'h-7 gap-1 px-3 text-xs has-[>svg]:px-2.5 [&_svg:not([class*=size-])]:size-3',
        sm: 'h-8 gap-1.5 px-4 text-sm has-[>svg]:px-3.5',
        lg: 'h-12 px-8 text-base has-[>svg]:px-7',
        icon: 'size-10 rounded-full',
        'icon-xs': "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-8 rounded-full',
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
