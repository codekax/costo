import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Mastercard-language textarea:
 *  - rounded-md (productivity radius) — pill never works for multiline
 *  - White surface on cream canvas; Dust Taupe border at rest
 *  - Body weight 450
 */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex field-sizing-content min-h-20 w-full rounded-md border border-input bg-secondary px-5 py-3 text-base [font-weight:450] transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-[2px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
