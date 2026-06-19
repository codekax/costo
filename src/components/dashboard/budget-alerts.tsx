import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import type { ProjectWithTotals } from '@/lib/db/queries/projects';
import { cn } from '@/lib/utils';

/**
 * Surfaces projects whose budget utilisation crossed 80% (warning) or 100%
 * (over). Renders nothing if no project trips the threshold. Compact bar
 * with anchor links into the projects.
 */
export async function BudgetAlerts({ projects }: { projects: ProjectWithTotals[] }) {
  const t = await getTranslations('dashboard.alerts');

  const flagged = projects
    .map((p) => {
      const ratios = [
        p.budget_ars && Number(p.budget_ars) > 0
          ? { currency: 'ARS' as const, ratio: p.total_ars / Number(p.budget_ars) }
          : null,
        p.budget_usd && Number(p.budget_usd) > 0
          ? { currency: 'USD' as const, ratio: p.total_usd / Number(p.budget_usd) }
          : null,
      ].filter((x): x is { currency: 'ARS' | 'USD'; ratio: number } => x !== null);
      const worst = ratios.sort((a, b) => b.ratio - a.ratio)[0];
      if (!worst || worst.ratio < 0.8) return null;
      return { project: p, ratio: worst.ratio, currency: worst.currency };
    })
    .filter(
      (x): x is { project: ProjectWithTotals; ratio: number; currency: 'ARS' | 'USD' } =>
        x !== null,
    )
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);

  if (flagged.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-start"
    >
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive"
        aria-hidden
      >
        <AlertTriangle className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="eyebrow !text-destructive">{t('title')}</p>
        <ul className="space-y-1 text-sm [font-weight:400]">
          {flagged.map(({ project, ratio, currency }) => {
            const over = ratio > 1;
            return (
              <li key={project.id} className="flex items-center gap-2">
                <Link
                  href={`/projects/${project.id}`}
                  className="truncate underline-offset-2 hover:underline"
                >
                  {project.name}
                </Link>
                <span
                  className={cn(
                    'shrink-0 tabular-nums text-xs',
                    over ? 'text-destructive [font-weight:510]' : 'text-muted-foreground',
                  )}
                >
                  {over
                    ? t('over', { pct: Math.round(ratio * 100), currency })
                    : t('near', { pct: Math.round(ratio * 100), currency })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
