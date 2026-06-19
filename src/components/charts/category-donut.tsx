import { pie as d3Pie, arc as d3Arc } from 'd3';
import { getTranslations } from 'next-intl/server';

import type { CategoryBreakdown } from '@/lib/db/queries/dashboard';
import { formatCurrency } from '@/utils/format';

import { ClientTooltip, TooltipContent, TooltipTrigger } from './_client-tooltip';

/**
 * Category breakdown — RSC donut with center total + 5-slot legend below.
 *
 * Replaces the recharts Pie. Geometry is computed on the server with d3
 * `pie()` + `arc()`; only the per-slice hover tooltip lives in a client
 * island. Strokes use the canvas color so adjacent slices look separated
 * without a hard outline.
 *
 * Visual additions vs the previous version:
 *  - Total amount printed inside the donut hole.
 *  - Legend listing the top 5 categories with color dot, name, currency
 *    amount and share percentage. Remaining categories collapse into an
 *    `+N more` count line so the layout never overflows.
 */
export async function CategoryDonut({
  data,
  currency,
}: {
  data: CategoryBreakdown[];
  currency: 'ARS' | 'USD';
}) {
  const t = await getTranslations('dashboard');

  const items = data
    .map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      value: currency === 'ARS' ? c.ars : c.usd,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = items.reduce((sum, c) => sum + c.value, 0);

  if (items.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        {t('donutEmpty', { currency })}
      </div>
    );
  }

  // Donut geometry. We pad slices apart with a small angle to give the
  // separation a chance to read even at small sizes. Inner radius is 60%
  // of outer so the hole is roomy enough for the total label.
  const radius = 100;
  const innerRadius = 60;
  const outerRadius = 96;
  const padAngle = items.length > 1 ? 0.018 : 0;

  const pieLayout = d3Pie<(typeof items)[number]>()
    .value((d) => d.value)
    .sort(null)
    .padAngle(padAngle);

  const arc = d3Arc<ReturnType<typeof pieLayout>[number]>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(2);

  const slices = pieLayout(items);

  const legend = items.slice(0, 5);
  const remaining = items.length - legend.length;

  return (
    <div className="flex h-full flex-col">
      <div className="relative mx-auto aspect-square w-full max-w-[240px]">
        <svg
          viewBox={`-${radius} -${radius} ${radius * 2} ${radius * 2}`}
          className="h-full w-full overflow-visible"
          role="img"
          aria-label={t('byCategory')}
        >
          {slices.map((slice) => {
            const d = arc(slice) ?? '';
            const item = slice.data;
            const share = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <ClientTooltip key={item.id}>
                <TooltipTrigger>
                  <g className="group/slice">
                    <path
                      d={d}
                      fill={item.color}
                      stroke="var(--card)"
                      strokeWidth={1.5}
                      className="transition-opacity group-hover/slice:opacity-100 [.group\/donut:hover_&]:opacity-60"
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                        aria-hidden
                      />
                      <span className="text-foreground [font-weight:510]">{item.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <span className="tabular-nums text-foreground [font-weight:510]">
                        {formatCurrency(item.value, currency)}
                      </span>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {share.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </ClientTooltip>
            );
          })}
        </svg>

        {/* Center label — total of the visible currency. Pointer-events-none
            so it never blocks slice hover. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {currency}
          </span>
          <span className="tabular-nums text-base [font-weight:510] tracking-[-0.02em] sm:text-lg">
            {formatCompact(total, currency)}
          </span>
        </div>
      </div>

      {/* Legend */}
      <ul className="mt-4 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
        {legend.map((item) => {
          const share = total > 0 ? (item.value / total) * 100 : 0;
          return (
            <li
              key={item.id}
              className="flex items-center gap-2 truncate text-xs [font-weight:400]"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <span className="truncate text-foreground">{item.name}</span>
              <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
                {share.toFixed(0)}%
              </span>
            </li>
          );
        })}
        {remaining > 0 && (
          <li className="text-xs text-muted-foreground">
            {t('legendMore', { count: remaining })}
          </li>
        )}
      </ul>
    </div>
  );
}

function formatCompact(value: number, currency: 'ARS' | 'USD'): string {
  // For totals shown inside the donut hole we use the compact intl notation
  // so big ARS numbers (~10M+) don't bleed past the inner ring.
  const locale = currency === 'ARS' ? 'es-AR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
