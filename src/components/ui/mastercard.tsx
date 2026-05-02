import * as React from 'react';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Mastercard editorial primitives.
 *
 * - Eyebrow: section-category signal (accent dot + uppercase tracked label)
 * - GhostWatermark: cream-on-cream display text layered behind portraits
 * - CircularPortrait: square→circle image crop with optional satellite CTA
 * - SatelliteCTA: white circle button with arrow, docks beside portraits
 * - OrbitalArc: thin Light Signal Orange decorative arc connecting portraits
 *
 * These are the surface treatments that make the language feel Mastercard
 * rather than generic. Use them in editorial sections (auth, error, hero,
 * dashboard hero, empty states) — not in dense data tables.
 */

export function Eyebrow({
  children,
  className,
  showDot = true,
}: {
  children: React.ReactNode;
  className?: string;
  showDot?: boolean;
}) {
  return (
    <span className={cn('eyebrow', className)}>
      {showDot ? <span className="eyebrow-dot" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function GhostWatermark({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('ghost-watermark', className)} aria-hidden>
      {children}
    </div>
  );
}

export function CircularPortrait({
  src,
  alt,
  size = 280,
  satellite,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  satellite?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <div
        className="size-full overflow-hidden rounded-full bg-muted"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="size-full object-cover" />
      </div>
      {satellite ? (
        <div className="absolute right-0 bottom-2 translate-x-1/3">{satellite}</div>
      ) : null}
    </div>
  );
}

export function SatelliteCTA({
  className,
  label = 'Discover',
  onClick,
  href,
}: {
  className?: string;
  label?: string;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <span className="sr-only">{label}</span>
      <ArrowRight className="size-5" aria-hidden />
    </>
  );

  const sharedClassName = cn(
    'inline-flex size-14 items-center justify-center rounded-full bg-secondary text-foreground shadow-sm transition-[transform,filter] hover:brightness-105 hover:-translate-y-0.5 active:brightness-95 active:translate-y-0',
    className,
  );

  if (href) {
    return (
      <a href={href} className={sharedClassName} aria-label={label}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={sharedClassName} aria-label={label}>
      {content}
    </button>
  );
}

/**
 * OrbitalArc — thin curved connector between circular portraits. Uses a
 * single SVG stroke in Light Signal Orange. Position via wrapper.
 */
export function OrbitalArc({
  className,
  width = 320,
  height = 80,
  curvature = 50,
}: {
  className?: string;
  width?: number;
  height?: number;
  curvature?: number;
}) {
  const path = `M 0 ${height / 2} Q ${width / 2} ${height / 2 - curvature}, ${width} ${height / 2}`;
  return (
    <svg
      className={cn('pointer-events-none', className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
    >
      <path
        d={path}
        stroke="var(--accent)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
