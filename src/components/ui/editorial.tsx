import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Small uppercase eyebrow label (wraps the `.eyebrow` component class). Used as
 * a typographic "category" cue above section values and form previews.
 */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn('eyebrow', className)}>{children}</span>;
}
