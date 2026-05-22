import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Apple search-input grammar — pill (`{rounded.pill}`), 17px body type,
 * 1px hairline border, ink-focus shift on focus. Matches Apple's
 * accessories-search treatment.
 */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-full border border-input bg-card px-5 py-1 text-[17px] [font-weight:400] transition-[border-color,box-shadow] outline-none',
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
