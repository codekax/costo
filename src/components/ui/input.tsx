import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Linear input grammar — pill (`rounded-full`), 13px text, 1px hairline border
 * on the card surface, indigo ring on focus. 32px tall to align with buttons.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full min-w-0 rounded-full border border-input bg-card px-3.5 py-1 text-[13px] [font-weight:400] transition-[border-color,box-shadow] outline-none',
        'placeholder:text-muted-foreground',
        'selection:bg-primary selection:text-primary-foreground',
        'file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[13px] file:[font-weight:510] file:text-foreground',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
