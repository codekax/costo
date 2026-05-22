import {
  scaleLinear,
  line as d3Line,
  curveMonotoneX,
  max as d3Max,
} from 'd3';
import { getLocale, getTranslations } from 'next-intl/server';

import type { Forecast, MonthlyPoint } from '@/lib/db/queries/dashboard';
import { formatCurrency } from '@/utils/format';

import { ClientTooltip, TooltipContent, TooltipTrigger } from './_client-tooltip';

/**
 * Monthly ARS/USD evolution — multi-line minimalist style (Wise/Linear-like).
 *
 * Each currency is drawn as an independent line whose vertical scale is
 * normalized to the full viewport — so the *shapes* are directly comparable
 * even though the absolute amounts live on very different ranges. The actual
 * value lives in a floating label anchored to the rightmost point of each
 * line. No dual y-axis, no overlapping gradient areas.
 *
 * Renders fully on the server; the hover tooltip is the only client island.
 */
export async function MonthlyEvolution({
  data,
  forecast,
}: {
  data: MonthlyPoint[];
  forecast?: Forecast;
}) {
  const locale = await getLocale();
  const t = await getTranslations('dashboard');

  const monthLabels = buildMonthLabels(locale);
  const points = data.map((p, idx) => {
    const monthIdx = parseInt(p.month.slice(5, 7), 10) - 1;
    return {
      idx,
      month: p.month,
      label: monthLabels[monthIdx] ?? p.month,
      ars: p.ars,
      usd: p.usd,
    };
  });

  const hasData = points.some((p) => p.ars > 0 || p.usd > 0);
  if (!hasData) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {t('monthlyEmpty')}
      </div>
    );
  }

  const xScale = scaleLinear()
    .domain([0, Math.max(points.length - 1, 1)])
    .range([0, 100]);

  // Forecast projection — only render when the current month is partially
  // through (>2 days elapsed, <last day) and the projected value materially
  // exceeds the MTD value. Otherwise the dashed extension adds noise.
  const showForecast =
    !!forecast &&
    forecast.daysElapsed > 2 &&
    forecast.daysElapsed < forecast.daysInMonth - 1 &&
    (forecast.projectedArs > forecast.mtdArs * 1.05 ||
      forecast.projectedUsd > forecast.mtdUsd * 1.05);

  // Independent y-scales — each currency uses the full vertical room. This
  // is the Wise pattern: don't squash one series against the other just
  // because the absolute amounts differ by orders of magnitude. Forecast
  // values participate in the max so the projection never clips above 100%.
  const arsMax =
    Math.max(
      d3Max(points, (p) => p.ars) ?? 0,
      showForecast ? forecast.projectedArs : 0,
    );
  const usdMax =
    Math.max(
      d3Max(points, (p) => p.usd) ?? 0,
      showForecast ? forecast.projectedUsd : 0,
    );
  const yScaleArs = scaleLinear()
    .domain([0, arsMax || 1])
    .range([100, 0]);
  const yScaleUsd = scaleLinear()
    .domain([0, usdMax || 1])
    .range([100, 0]);

  const arsLine = d3Line<(typeof points)[number]>()
    .x((d) => xScale(d.idx))
    .y((d) => yScaleArs(d.ars))
    .curve(curveMonotoneX);
  const usdLine = d3Line<(typeof points)[number]>()
    .x((d) => xScale(d.idx))
    .y((d) => yScaleUsd(d.usd))
    .curve(curveMonotoneX);

  const arsPath = arsLine(points) ?? '';
  const usdPath = usdLine(points) ?? '';

  const lastPoint = points[points.length - 1]!;
  const lastArsTotal = points.reduce((acc, p) => acc + p.ars, 0);
  const lastUsdTotal = points.reduce((acc, p) => acc + p.usd, 0);

  return (
    <div
      className="relative h-[240px] w-full [--m-bottom:28px] [--m-left:12px] [--m-right:12px] [--m-top:36px] sm:h-[280px] sm:[--m-right:92px]"
      role="img"
      aria-label={t('monthlyTitle')}
    >
      {/* Header summary — totals last 12 months. Sits above the chart in the
          top margin so it doesn't compete with the line geometry. */}
      <div className="pointer-events-none absolute left-3 right-3 top-0 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: 'var(--chart-1)' }}
            aria-hidden
          />
          ARS
          <span className="tabular-nums text-foreground [font-weight:500]">
            {formatCurrency(lastArsTotal, 'ARS')}
          </span>
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: 'var(--chart-2)' }}
            aria-hidden
          />
          USD
          <span className="tabular-nums text-foreground [font-weight:500]">
            {formatCurrency(lastUsdTotal, 'USD')}
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
          {/* Hairline grid — 4 horizontal lines, no axis numbers */}
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

          {/* ARS series */}
          <path
            d={arsPath}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Dots for each ARS point */}
          {points.map((p) => (
            <circle
              key={`ars-dot-${p.month}`}
              cx={xScale(p.idx)}
              cy={yScaleArs(p.ars)}
              r={1.25}
              fill="var(--background)"
              stroke="var(--chart-1)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Forecast projection — dashed vertical hint from MTD to end-of-month
              estimate at the current month's x position. Same color tint per
              series so the visual association reads instantly. */}
          {showForecast && (
            <>
              <line
                x1={xScale(lastPoint.idx)}
                y1={yScaleArs(lastPoint.ars)}
                x2={xScale(lastPoint.idx)}
                y2={yScaleArs(forecast!.projectedArs)}
                stroke="var(--chart-1)"
                strokeWidth={1.25}
                strokeDasharray="2 2.5"
                vectorEffect="non-scaling-stroke"
                opacity={0.85}
              />
              <circle
                cx={xScale(lastPoint.idx)}
                cy={yScaleArs(forecast!.projectedArs)}
                r={1.6}
                fill="var(--background)"
                stroke="var(--chart-1)"
                strokeDasharray="2 1.5"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}

          {/* USD series */}
          <path
            d={usdPath}
            fill="none"
            stroke="var(--chart-2)"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {showForecast && (
            <>
              <line
                x1={xScale(lastPoint.idx)}
                y1={yScaleUsd(lastPoint.usd)}
                x2={xScale(lastPoint.idx)}
                y2={yScaleUsd(forecast!.projectedUsd)}
                stroke="var(--chart-2)"
                strokeWidth={1.25}
                strokeDasharray="2 2.5"
                vectorEffect="non-scaling-stroke"
                opacity={0.85}
              />
              <circle
                cx={xScale(lastPoint.idx)}
                cy={yScaleUsd(forecast!.projectedUsd)}
                r={1.6}
                fill="var(--background)"
                stroke="var(--chart-2)"
                strokeDasharray="2 1.5"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
          {points.map((p) => (
            <circle
              key={`usd-dot-${p.month}`}
              cx={xScale(p.idx)}
              cy={yScaleUsd(p.usd)}
              r={1.25}
              fill="var(--background)"
              stroke="var(--chart-2)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Hover slices — one tooltip per month with a vertical crosshair */}
          {points.map((p, index) => {
            const cx = xScale(p.idx);
            const prevX = index > 0 ? xScale(points[index - 1]!.idx) : cx;
            const nextX =
              index < points.length - 1 ? xScale(points[index + 1]!.idx) : cx;
            const left = (prevX + cx) / 2;
            const right = (cx + nextX) / 2;
            const width = right - left || 1;
            return (
              <ClientTooltip key={p.month}>
                <TooltipTrigger>
                  <g className="group/tooltip">
                    <line
                      x1={cx}
                      y1={0}
                      x2={cx}
                      y2={100}
                      stroke="var(--foreground)"
                      strokeOpacity={0.25}
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                      className="opacity-0 transition-opacity group-hover/tooltip:opacity-100"
                      style={{ pointerEvents: 'none' }}
                    />
                    <circle
                      cx={cx}
                      cy={yScaleArs(p.ars)}
                      r={2.4}
                      fill="var(--chart-1)"
                      vectorEffect="non-scaling-stroke"
                      className="opacity-0 transition-opacity group-hover/tooltip:opacity-100"
                      style={{ pointerEvents: 'none' }}
                    />
                    <circle
                      cx={cx}
                      cy={yScaleUsd(p.usd)}
                      r={2.4}
                      fill="var(--chart-2)"
                      vectorEffect="non-scaling-stroke"
                      className="opacity-0 transition-opacity group-hover/tooltip:opacity-100"
                      style={{ pointerEvents: 'none' }}
                    />
                    <rect
                      x={left}
                      y={0}
                      width={width}
                      height={100}
                      fill="transparent"
                      className="cursor-default"
                    />
                  </g>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1.5">
                    <div className="text-[font-weight:500] text-foreground">{p.label}</div>
                    <div className="flex items-center justify-between gap-6">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: 'var(--chart-1)' }}
                          aria-hidden
                        />
                        ARS
                      </span>
                      <span className="tabular-nums text-foreground [font-weight:500]">
                        {formatCurrency(p.ars, 'ARS')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-6">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: 'var(--chart-2)' }}
                          aria-hidden
                        />
                        USD
                      </span>
                      <span className="tabular-nums text-foreground [font-weight:500]">
                        {formatCurrency(p.usd, 'USD')}
                      </span>
                    </div>
                  </div>
                </TooltipContent>
              </ClientTooltip>
            );
          })}
        </svg>
      </div>

      {/* Floating end-of-line labels — values for the most recent month,
          anchored at the right margin. Two pills stacked vertically when
          they would overlap. Position is computed from the y-scales above.
          Hidden on mobile — the header totals already convey the value and
          the 92px right margin would eat 1/3 of a narrow viewport. */}
      <div className="hidden sm:contents">
      <EndLabels
        topPercent={yScaleArs(lastPoint.ars)}
        bottomPercent={yScaleUsd(lastPoint.usd)}
        arsValue={formatCurrency(lastPoint.ars, 'ARS')}
        usdValue={formatCurrency(lastPoint.usd, 'USD')}
      />
      </div>

      {/* X axis — first, last, and every-other month label */}
      <div
        className="pointer-events-none absolute bottom-0 left-[var(--m-left)] right-[var(--m-right)] h-[var(--m-bottom)]"
        aria-hidden
      >
        {points.map((p, i) => {
          const isEdge = i === 0 || i === points.length - 1;
          if (!isEdge && i % 2 !== 0) return null;
          return (
            <div
              key={p.month}
              style={{ left: `${xScale(p.idx)}%` }}
              className="absolute top-1 -translate-x-1/2 text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              {p.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Two stacked value pills hugging the right edge of the chart. They sit
 * inside the right margin so they never compete with the line geometry.
 * If the natural vertical positions are too close (< 18%), we stack them
 * with a fixed gap rather than overlapping.
 */
function EndLabels({
  topPercent,
  bottomPercent,
  arsValue,
  usdValue,
}: {
  topPercent: number;
  bottomPercent: number;
  arsValue: string;
  usdValue: string;
}) {
  const tooClose = Math.abs(topPercent - bottomPercent) < 18;
  const adjustedTop = tooClose ? Math.min(topPercent, bottomPercent) - 9 : topPercent;
  const adjustedBottom = tooClose
    ? Math.max(topPercent, bottomPercent) + 9
    : bottomPercent;

  return (
    <div className="pointer-events-none absolute inset-y-[var(--m-top)] right-2 w-[calc(var(--m-right)-12px)]">
      <Pill top={adjustedTop} colorVar="--chart-1" code="ARS" value={arsValue} />
      <Pill top={adjustedBottom} colorVar="--chart-2" code="USD" value={usdValue} />
    </div>
  );
}

function Pill({
  top,
  colorVar,
  code,
  value,
}: {
  top: number;
  colorVar: '--chart-1' | '--chart-2';
  code: 'ARS' | 'USD';
  value: string;
}) {
  return (
    <div
      style={{ top: `${Math.max(0, Math.min(100, top))}%` }}
      className="absolute left-0 -translate-y-1/2"
    >
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-popover px-2 py-0.5 shadow-sm">
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: `var(${colorVar})` }}
          aria-hidden
        />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{code}</span>
        <span className="tabular-nums text-[11px] [font-weight:500] text-foreground">{value}</span>
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
