import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkline } from '@/components/charts/sparkline';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format';

type Currency = 'ARS' | 'USD';

/**
 * KPI card with delta vs previous period + 12-week sparkline. When
 * `previous === null` (period='all' or no baseline) the delta chip is
 * suppressed but the sparkline still renders.
 */
export function TotalCard({
  label,
  amount,
  previous,
  currency,
  spark,
}: {
  label: string;
  amount: number;
  previous: number | null;
  currency: Currency;
  spark: number[];
}) {
  const t = useTranslations('dashboard');
  const tonal = currency === 'ARS' ? 'var(--chart-1)' : 'var(--chart-2)';

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow">{label}</p>
          {previous !== null && (
            <DeltaChip current={amount} previous={previous} />
          )}
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="truncate text-[28px] tabular-nums tracking-[-0.022em] [font-weight:590] leading-[1.18] sm:text-[34px]">
            {formatCurrency(amount, currency)}
          </p>
          <Sparkline
            values={spark}
            color={tonal}
            className="h-9 w-20 shrink-0 sm:w-28"
          />
        </div>
        {previous !== null && (
          <p className="text-xs tabular-nums text-muted-foreground">
            {t('vsPrev', { amount: formatCurrency(previous, currency) })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function DeltaChip({ current, previous }: { current: number; previous: number }) {
  const t = useTranslations('dashboard');
  const delta = previous > 0 ? ((current - previous) / previous) * 100 : null;

  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        {t('noBaseline')}
      </span>
    );
  }

  const up = delta > 0;
  const flat = Math.abs(delta) < 0.5;
  // Higher spend reads as a warning, not a win — flip the usual green/red.
  const tone = flat
    ? 'bg-muted text-muted-foreground'
    : up
      ? 'bg-destructive/10 text-destructive'
      : 'bg-status-success/10 text-status-success-foreground';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] tabular-nums [font-weight:510]',
        tone,
      )}
    >
      {flat ? (
        <Minus className="size-3" aria-hidden />
      ) : up ? (
        <ArrowUpRight className="size-3" aria-hidden />
      ) : (
        <ArrowDownRight className="size-3" aria-hidden />
      )}
      {up ? '+' : ''}
      {delta.toFixed(0)}%
    </span>
  );
}
