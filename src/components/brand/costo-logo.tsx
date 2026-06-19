import { cn } from '@/lib/utils';

/**
 * Brand mark for the public surface (auth + landing). A coin-stack glyph —
 * three stacked ellipses — that reads as "money over time", rendered in the
 * current text color so it inherits whatever theme scope wraps it.
 */
export function CostoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn('size-7', className)}
      aria-hidden
    >
      <ellipse cx="12" cy="6" rx="7" ry="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Mark + lowercase wordmark, lockup used in the nav and auth header.
 */
export function CostoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <CostoMark className="size-6" />
      <span className="text-[19px] [font-weight:590] tracking-[-0.02em]">costo</span>
    </span>
  );
}
