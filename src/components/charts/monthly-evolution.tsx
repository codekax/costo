'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useLocale, useTranslations } from 'next-intl';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatCurrency } from '@/utils/format';
import type { MonthlyPoint } from '@/lib/db/queries/dashboard';

import { CURRENCY_SERIES, type CurrencySeriesKey } from '@/constants/currencies';

function buildMonthLabels(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short' });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2000, i, 1)).replace(/\.$/, ''));
}

const chartConfig = {
  ars: { label: CURRENCY_SERIES.ars, color: 'var(--chart-1)' },
  usd: { label: CURRENCY_SERIES.usd, color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function MonthlyEvolution({ data }: { data: MonthlyPoint[] }) {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const monthLabels = buildMonthLabels(locale);
  const formatted = data.map((p) => {
    const monthIdx = parseInt(p.month.slice(5, 7), 10) - 1;
    return {
      label: monthLabels[monthIdx] ?? p.month,
      ars: p.ars,
      usd: p.usd,
    };
  });

  const hasData = formatted.some((p) => p.ars > 0 || p.usd > 0);
  if (!hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {t('monthlyEmpty')}
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
      <AreaChart data={formatted} margin={{ left: 0, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="fillArs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-ars)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--color-ars)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillUsd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-usd)" stopOpacity={0.6} />
            <stop offset="95%" stopColor="var(--color-usd)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          yAxisId="ars"
          orientation="left"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => abbreviate(v)}
          width={60}
        />
        <YAxis
          yAxisId="usd"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => abbreviate(v)}
          width={50}
        />
        <ChartTooltip
          cursor
          content={
            <ChartTooltipContent
              labelKey="label"
              formatter={(value, name) => {
                const currency = CURRENCY_SERIES[name as CurrencySeriesKey];
                return (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span>{currency}</span>
                    <span className="tabular-nums [font-weight:500]">
                      {formatCurrency(Number(value), currency)}
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Area
          yAxisId="ars"
          dataKey="ars"
          type="monotone"
          stroke="var(--color-ars)"
          fill="url(#fillArs)"
          strokeWidth={2}
        />
        <Area
          yAxisId="usd"
          dataKey="usd"
          type="monotone"
          stroke="var(--color-usd)"
          fill="url(#fillUsd)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function abbreviate(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}
