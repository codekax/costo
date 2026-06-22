import { cn } from '@/lib/utils';

/**
 * Apple-language skeleton primitive.
 *  - Subtle pulse on a low-opacity foreground tint.
 *  - Default radius `rounded-md` (6px) — ideal for text & small chips.
 *    For card- or row-shaped skeletons, override with `rounded-lg` (card)
 *    or `rounded-2xl` (row) so the placeholder matches the real surface.
 *  - Lower opacity in dark mode so the skeleton doesn't compete with the
 *    deep-tile card surface (#141416).
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-pulse rounded-md bg-foreground/[0.08] dark:bg-foreground/[0.06]',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
