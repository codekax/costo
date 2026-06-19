import { scaleLinear, max as d3Max } from 'd3';
import { getLocale, getTranslations } from 'next-intl/server';

import type { Forecast, MonthlyPoint } from '@/lib/db/queries/dashboard';
import { formatCurrency } from '@/utils/format';

import { ClientTooltip, TooltipContent, TooltipTrigger } from './_client-tooltip';

/**
 * Monthly expense evolution — single-currency bar chart.
 *
 * Monthly spend is a set of discrete per-month totals, not a continuous
 * signal, so bars read more honestly than an interpolated line: bar height
 * answers "did I spend more this month than last?" at a glance. One currency
 * is shown at a time (ARS/USD toggle on the parent) so the y-axis is a real
 * single scale instead of two normalized lines that can't be compared.
 *
 * The current (last) month renders its month-to-date value solid plus a
 * dashed ghost extension up to the projected end-of-month estimate, when the
 * forecast is meaningful.
 *
 * Renders fully on the server; the hover tooltip is the only client island.
 */
export async function MonthlyEvolution({
  data,
  forecast,
  currency,
}: {
  data: MonthlyPoint[];
  forecast?: Forecast;
  currency: 'ARS' | 'USD';
}) {
  const locale = await getLocale();
  const t = await getTranslations('dashboard');

  const monthLabels = buildMonthLabels(locale);
  const value = (p: MonthlyPoint): number => (currency === 'ARS' ? p.ars : p.usd);

  // Trim leading empty months so the chart starts where data actually begins
  // (the query seeds a full 12-month window for mid-series continuity).
  const firstWithData = data.findIndex((p) => p.ars > 0 || p.usd > 0);
  const visible = firstWithData === -1 ? data : data.slice(firstWithData);

  const points = visible.map((p, idx) => {
    const monthIdx = parseInt(p.month.slice(5, 7), 10) - 1;
    return {
      idx,
      month: p.month,
      label: monthLabels[monthIdx] ?? p.month,
      value: value(p),
    };
  });

  const hasData = points.some((p) => p.value > 0);
  if (!hasData) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground sm:h-[280px]">
        {t('monthlyEmpty')}
      </div>
    );
  }

  // Forecast projection — only when the current month is partially through
  // (>2 days elapsed, <last day) and the projected value materially exceeds
  // the month-to-date value. Otherwise the ghost bar is noise.
  const projected = currency === 'ARS' ? forecast?.projectedArs ?? 0 : forecast?.projectedUsd ?? 0;
  const mtd = currency === 'ARS' ? forecast?.mtdArs ?? 0 : forecast?.mtdUsd ?? 0;
  const showForecast =
    !!forecast &&
    forecast.daysElapsed > 2 &&
    forecast.daysElapsed < forecast.daysInMonth - 1 &&
    projected > mtd * 1.05;

  const maxValue = Math.max(d3Max(points, (p) => p.value) ?? 0, showForecast ? projected : 0);
  const yScale = scaleLinear()
    .domain([0, maxValue || 1])
    .range([100, 0]);

  const total = points.reduce((acc, p) => acc + p.value, 0);
  const color = currency === 'ARS' ? 'var(--chart-1)' : 'var(--chart-2)';
  const colorVar = currency === 'ARS' ? '--chart-1' : '--chart-2';

  // Band layout — each month gets an equal slot; the bar fills 62% of it,
  // centered, leaving a consistent gutter on both sides.
  const slot = 100 / points.length;
  const barW = slot * 0.62;
  const showValueLabels = points.length <= 8;
  const lastIdx = points.length - 1;

  return (
    <div
      className="relative h-[240px] w-full [--m-bottom:28px] [--m-left:8px] [--m-right:8px] [--m-top:36px] sm:h-[280px]"
      role="img"
      aria-label={t('monthlyTitle')}
    >
      {/* Header — currency code + total of the visible window. */}
      <div className="pointer-events-none absolute left-3 right-3 top-0 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
          {currency}
          <span className="tabular-nums text-foreground [font-weight:510]">
            {formatCurrency(total, currency)}
          </span>
        </span>
      </div>

      {/* Chart area */}
      <div className="absolute inset-0 h-[calc(100%-var(--m-top)-var(--m-bottom))] w-[calc(100%-var(--m-left)-var(--m-right))] translate-x-[var(--m-left)] translate-y-[var(--m-top)] overflow-visible">
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Hairline grid — baseline solid, the rest dashed. */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1={0}
              x2={100}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth={0.4}
              strokeDasharray={y === 100 ? undefined : '2 3'}
              vectorEffect="non-scaling-stroke"
              opacity={y === 100 ? 1 : 0.6}
            />
          ))}

          {points.map((p) => {
            const x = slot * p.idx + (slot - barW) / 2;
            const top = yScale(p.value);
            const isCurrent = p.idx === lastIdx;
            return (
              <g key={`bar-${p.month}`}>
                <rect
                  x={x}
                  y={p.value > 0 ? Math.min(top, 98.5) : 100}
                  width={barW}
                  height={p.value > 0 ? Math.max(100 - top, 1.5) : 0}
                  fill={color}
                  opacity={isCurrent && showForecast ? 0.9 : 1}
                />
                {/* Forecast ghost — dashed outline from MTD top up to the
                    projected end-of-month estimate on the current month. */}
                {isCurrent && showForecast && (
                  <rect
                    x={x}
                    y={yScale(projected)}
                    width={barW}
                    height={Math.max(top - yScale(projected), 0)}
                    fill={color}
                    fillOpacity={0.12}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
              </g>
            );
          })}

          {/* Hover slices — one tooltip per month spanning its full slot. */}
          {points.map((p) => {
            const left = slot * p.idx;
            return (
              <ClientTooltip key={p.month}>
                <TooltipTrigger>
                  <g className="group/bar">
                    <rect
                      x={left + (slot - barW) / 2}
                      y={0}
                      width={barW}
                      height={100}
                      fill="var(--foreground)"
                      className="opacity-0 transition-opacity group-hover/bar:opacity-[0.04]"
                      style={{ pointerEvents: 'none' }}
                    />
                    <rect x={left} y={0} width={slot} height={100} fill="transparent" />
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1.5">
                    <div className="text-foreground [font-weight:510]">{p.label}</div>
                    <div className="flex items-center justify-between gap-6">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: color }}
                          aria-hidden
                        />
                        {currency}
                      </span>
                      <span className="tabular-nums text-foreground [font-weight:510]">
                        {formatCurrency(p.value, currency)}
                      </span>
                    </div>
                    {p.idx === lastIdx && showForecast && (
                      <div className="flex items-center justify-between gap-6 text-muted-foreground">
                        <span>{t('forecastLabel')}</span>
                        <span className="tabular-nums [font-weight:510]">
                          {formatCurrency(projected, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </ClientTooltip>
            );
          })}
        </svg>
      </div>

      {/* Value labels above each bar — only when few enough months to fit. */}
      {showValueLabels && (
        <div
          className="pointer-events-none absolute left-[var(--m-left)] right-[var(--m-right)] top-[var(--m-top)] h-[calc(100%-var(--m-top)-var(--m-bottom))]"
          aria-hidden
        >
          {points.map((p) => {
            if (p.value <= 0) return null;
            return (
              <div
                key={`lbl-${p.month}`}
                style={{
                  left: `${slot * p.idx + slot / 2}%`,
                  top: `${yScale(p.value)}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-[calc(100%+4px)] whitespace-nowrap text-[10px] tabular-nums text-muted-foreground"
              >
                {formatCompact(p.value, currency, locale)}
              </div>
            );
          })}
        </div>
      )}

      {/* X axis — one label per month. */}
      <div
        className="pointer-events-none absolute bottom-0 left-[var(--m-left)] right-[var(--m-right)] h-[var(--m-bottom)]"
        aria-hidden
      >
        {points.map((p) => (
          <div
            key={p.month}
            style={{ left: `${slot * p.idx + slot / 2}%` }}
            className="absolute top-1 -translate-x-1/2 text-[11px] uppercase tracking-wide text-muted-foreground"
          >
            {p.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildMonthLabels(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short' });
  return Array.from({ length: 12 }, (_, i) =>
    fmt.format(new Date(2000, i, 1)).replace(/\.$/, ''),
  );
}

function formatCompact(value: number, currency: 'ARS' | 'USD', locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
