import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Mastercard-language input:
 *  - Pill-shaped (rounded-full) — kept as Mastercard signature even with productivity radii
 *  - White surface on cream canvas; Dust Taupe border at rest
 *  - Focus shifts border to Ink Black + crisp 2px ring
 *  - Body weight 450 (Mastercard's signature)
 *  - Pairs with Select trigger (also pill) and Badge (pill chip)
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-full border border-input bg-secondary px-5 py-1 text-base [font-weight:450] transition-[border-color,box-shadow] outline-none',
        'placeholder:text-muted-foreground',
        'selection:bg-foreground selection:text-background',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:[font-weight:500] file:text-foreground',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-foreground focus-visible:ring-[2px] focus-visible:ring-ring/40',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
