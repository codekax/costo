'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  DASHBOARD_PERIODS,
  type DashboardPeriod,
} from '@/lib/dashboard-period';

/**
 * Pill group toggle bound to ?period=. Defaults to 3m which matches
 * `parseDashboardPeriod`'s fallback.
 */
export function PeriodSelector({ value }: { value: DashboardPeriod }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('dashboard.period');
  const [pending, startTransition] = useTransition();

  function setPeriod(next: DashboardPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === '3m') params.delete('period');
    else params.set('period', next);
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `/dashboard?${qs}` : '/dashboard', { scroll: false });
    });
  }

  return (
    <div
      role="tablist"
      aria-label={t('label')}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 transition-opacity',
        pending && 'opacity-70',
      )}
    >
      {DASHBOARD_PERIODS.map((p) => {
        const active = p === value;
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setPeriod(p)}
            className={cn(
              'rounded-full px-3 py-1 text-xs [font-weight:500] tabular-nums transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(p)}
          </button>
        );
      })}
    </div>
  );
}
