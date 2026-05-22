import { line as d3Line, curveMonotoneX, scaleLinear, max as d3Max } from 'd3';

/**
 * RSC-rendered sparkline. SVG `preserveAspectRatio="none"` so it stretches
 * cleanly to whatever box the parent gives it. Use for inline trend hints
 * inside KPI cards.
 */
export function Sparkline({
  values,
  color = 'var(--chart-1)',
  className = 'h-8 w-24',
  fill = true,
}: {
  values: number[];
  color?: string;
  className?: string;
  fill?: boolean;
}) {
  if (values.length === 0 || values.every((v) => v === 0)) {
    return <div className={className} aria-hidden />;
  }

  const xs = values.map((_, i) => i);
  const max = d3Max(values) ?? 1;
  const x = scaleLinear().domain([0, Math.max(values.length - 1, 1)]).range([0, 100]);
  const y = scaleLinear().domain([0, max || 1]).range([28, 2]);

  const linePath =
    d3Line<number>()
      .x((_, i) => x(xs[i]!))
      .y((d) => y(d))
      .curve(curveMonotoneX)(values) ?? '';

  const areaPath = `${linePath} L 100 30 L 0 30 Z`;

  return (
    <svg
      viewBox="0 0 100 30"
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      {fill && (
        <path d={areaPath} fill={color} opacity={0.12} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
