'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

/**
 * Generic hover/touch tooltip helper for SVG-based charts.
 *
 * Lifted from rosencharts/helpers, adapted to project tokens (cream/ink,
 * radius-md, atmospheric shadow) and locked-down a11y (`role="tooltip"`).
 *
 * The chart that uses it stays RSC — only the tooltip overlay itself is
 * client. Each <TooltipTrigger> hovers a slice of SVG; the floating panel
 * portals to <body>.
 */

type TooltipContextValue = {
  tooltip: { x: number; y: number } | undefined;
  setTooltip: (tooltip: { x: number; y: number } | undefined) => void;
};

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined);

function useTooltipContext(componentName: string): TooltipContextValue {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error(`${componentName} must be used inside <ClientTooltip>`);
  }
  return context;
}

function Tooltip({ children }: { children: React.ReactNode }) {
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number }>();
  return (
    <TooltipContext.Provider value={{ tooltip, setTooltip }}>{children}</TooltipContext.Provider>
  );
}

const TooltipTrigger = React.forwardRef<SVGGElement, { children: React.ReactNode }>(
  ({ children }, forwardedRef) => {
    const context = useTooltipContext('TooltipTrigger');
    const triggerRef = React.useRef<SVGGElement | null>(null);

    React.useEffect(() => {
      function handleClickOutside(event: MouseEvent | TouchEvent) {
        if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
          context.setTooltip(undefined);
        }
      }
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }, [context]);

    return (
      <g
        ref={(node) => {
          triggerRef.current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            forwardedRef.current = node;
          }
        }}
        onPointerMove={(event) => {
          if (event.pointerType === 'mouse') {
            context.setTooltip({ x: event.clientX, y: event.clientY });
          }
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') {
            context.setTooltip(undefined);
          }
        }}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (!touch) return;
          context.setTooltip({ x: touch.clientX, y: touch.clientY });
          setTimeout(() => context.setTooltip(undefined), 2000);
        }}
      >
        {children}
      </g>
    );
  },
);
TooltipTrigger.displayName = 'TooltipTrigger';

function TooltipContent({ children }: { children: React.ReactNode }) {
  const context = useTooltipContext('TooltipContent');
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const isClient = typeof document !== 'undefined';

  if (!context.tooltip || !isClient) return null;

  const { x, y } = context.tooltip;
  const tooltipWidth = tooltipRef.current?.offsetWidth ?? 0;
  const viewportWidth = window.innerWidth;
  const willOverflowRight = x + tooltipWidth + 16 > viewportWidth;
  const isMobile = viewportWidth < 768;

  const position = isMobile
    ? { top: y, left: x + 20 }
    : {
        top: y - 24,
        left: willOverflowRight ? x - tooltipWidth - 12 : x + 12,
      };

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      className="pointer-events-none fixed z-[60] rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md"
      style={position}
    >
      {children}
    </div>,
    document.body,
  );
}

export { Tooltip as ClientTooltip, TooltipTrigger, TooltipContent };
