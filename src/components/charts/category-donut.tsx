'use client';

import { Pie, PieChart, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { formatCurrency } from '@/utils/format';
import type { CategoryBreakdown } from '@/lib/db/queries/dashboard';

export function CategoryDonut({
  data,
  currency,
}: {
  data: CategoryBreakdown[];
  currency: 'ARS' | 'USD';
}) {
  const filtered = data
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      value: currency === 'ARS' ? c.ars : c.usd,
    }))
    .filter((c) => c.value > 0);

  const total = filtered.reduce((sum, c) => sum + c.value, 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Sin gastos en {currency} en los últimos 12 meses.
      </div>
    );
  }

  const chartConfig: ChartConfig = filtered.reduce<ChartConfig>((acc, c) => {
    acc[c.id] = { label: c.name, color: c.color };
    return acc;
  }, {});

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[260px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, item) => (
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.payload.color }}
                  />
                  <span>{item.payload.name}</span>
                  <span className="ml-auto font-mono font-semibold">
                    {formatCurrency(Number(value), currency)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {((Number(value) / total) * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            />
          }
        />
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          innerRadius={64}
          outerRadius={100}
          strokeWidth={2}
        >
          {filtered.map((c) => (
            <Cell key={c.id} fill={c.color} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
