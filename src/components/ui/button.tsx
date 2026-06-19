import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

/**
 * Linear-language buttons (replicated 1:1 from linear.app's Button.css):
 *  - default (primary):   indigo #5e6ad2 fill, white ink — brightness on hover
 *  - secondary:           subtle neutral surface + hairline (the Linear "gray")
 *  - outline (tertiary):  card fill + border, muted ink → foreground on hover
 *  - ghost:               transparent, muted ink, neutral fill on hover
 *  - destructive:         solid red — same geometry, different ink
 *  - link:                inline indigo, underline on hover
 *  - dark-utility:        invert (ink fill / canvas ink) high-contrast button
 *  - satellite:           floating round action (FAB)
 *
 * Weight 510 (Linear's signature medium), 6px radius, 13px text, .16s ease-out.
 * Press is `brightness` + `scale(0.97)`.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-transparent text-[13px] [font-weight:510] outline-none transition-[background-color,border-color,box-shadow,filter,transform] duration-150 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:brightness-110 active:brightness-95',
        secondary:
          'bg-secondary text-secondary-foreground border-border hover:bg-accent',
        destructive:
          'bg-destructive text-destructive-foreground hover:brightness-110 active:brightness-95',
        outline:
          'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-foreground',
        link: 'text-link underline-offset-4 hover:underline rounded-none',
        'dark-utility':
          'bg-foreground text-background hover:brightness-110 active:brightness-95',
        satellite:
          'bg-secondary text-foreground border-border rounded-full hover:bg-accent',
      },
      size: {
        default: 'h-8 px-3',
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-7 gap-1 px-2.5',
        lg: 'h-9 px-3.5 text-sm',
        icon: 'size-8',
        'icon-xs': "size-6 [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-7',
        'icon-lg': 'size-9',
        satellite: "size-14 rounded-full [&_svg:not([class*='size-'])]:size-5",
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
