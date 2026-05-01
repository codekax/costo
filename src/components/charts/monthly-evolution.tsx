'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatCurrency } from '@/utils/format';
import type { MonthlyPoint } from '@/lib/db/queries/dashboard';

const MONTH_LABELS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const chartConfig = {
  ars: { label: 'ARS', color: 'var(--chart-1)' },
  usd: { label: 'USD', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function MonthlyEvolution({ data }: { data: MonthlyPoint[] }) {
  const formatted = data.map((p) => {
    const monthIdx = parseInt(p.month.slice(5, 7), 10) - 1;
    return {
      label: MONTH_LABELS_ES[monthIdx] ?? p.month,
      ars: p.ars,
      usd: p.usd,
    };
  });

  const hasData = formatted.some((p) => p.ars > 0 || p.usd > 0);
  if (!hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        Sin datos suficientes para graficar evolución mensual.
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
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span>{name === 'ars' ? 'ARS' : 'USD'}</span>
                  <span className="font-mono font-semibold tabular-nums">
                    {formatCurrency(Number(value), name === 'ars' ? 'ARS' : 'USD')}
                  </span>
                </div>
              )}
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
