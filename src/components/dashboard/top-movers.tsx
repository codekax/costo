import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { CategoryBreakdown } from '@/lib/db/queries/dashboard';
import { cn } from '@/lib/utils';

type Mover = {
  category: CategoryBreakdown;
  pct: number;
  direction: 'up' | 'down';
};

/**
 * Categories that moved the most vs the previous period. We exclude
 * brand-new categories (no prev baseline) — they would always show as
 * `+Infinity %` and dominate the list with no real signal.
 */
export function TopMovers({ categories }: { categories: CategoryBreakdown[] }) {
  const t = useTranslations('dashboard');

  const movers = categories
    .map((c): Mover | null => {
      const cur = c.ars + c.usd;
      const prev = c.prevArs + c.prevUsd;
      if (prev <= 0) return null;
      const pct = ((cur - prev) / prev) * 100;
      if (Math.abs(pct) < 10) return null;
      return { category: c, pct, direction: pct >= 0 ? 'up' : 'down' };
    })
    .filter((x): x is Mover => x !== null)
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, 5);

  if (movers.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{t('moversEmpty')}</p>
    );
  }

  return (
    <ul className="space-y-1">
      {movers.map(({ category, pct, direction }) => (
        <li key={category.id}>
          <Link
            href={`/expenses?category=${category.id}`}
            className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-foreground/[0.03]"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            <span className="truncate text-sm [font-weight:500] tracking-[-0.32px]">
              {category.name}
            </span>
            <span
              className={cn(
                'ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] tabular-nums [font-weight:500]',
                direction === 'up'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-status-success/30 text-status-success-foreground',
              )}
            >
              {direction === 'up' ? (
                <ArrowUpRight className="size-3" aria-hidden />
              ) : (
                <ArrowDownRight className="size-3" aria-hidden />
              )}
              {direction === 'up' ? '+' : ''}
              {pct.toFixed(0)}%
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
