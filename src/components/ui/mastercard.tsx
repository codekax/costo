import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Editorial primitives kept for the auth split-screen panel.
 *
 * Originally inherited from a "Mastercard" language; trimmed to Apple's
 * typographic-only treatment — no decorative dots, no satellite buttons, no
 * orbital arcs. Just the eyebrow + a faint display watermark behind the
 * headline.
 *
 * Why these still live here: the auth hero panel needs a typographic
 * "category" cue above the headline and a soft display layer behind it.
 * Reusing the same vocabulary across auth keeps the brand language coherent.
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

export function GhostWatermark({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'pointer-events-none select-none text-[clamp(64px,8vw,140px)] [font-weight:590] leading-[0.9] tracking-[-0.04em] text-foreground/[0.04]',
        className,
      )}
      aria-hidden
    >
      {children}
    </div>
  );
}
