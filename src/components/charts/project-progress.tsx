import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { formatCurrency } from '@/utils/format';
import { cn } from '@/lib/utils';
import type { ProjectWithTotals } from '@/lib/db/queries/projects';

/**
 * Active projects with budget progress.
 *
 * Each project shows up to two micro progress bars (one per currency that
 * has a budget). Colors track utilisation:
 *  - under 80%  → primary
 *  - 80–100%    → accent (warning)
 *  - over 100%  → destructive, with an "Over budget" pill
 *
 * Bars are plain divs (no Radix progress) — no JS, RSC-friendly.
 */
export function ProjectProgressList({ projects }: { projects: ProjectWithTotals[] }) {
  const t = useTranslations('dashboard');
  const tProjects = useTranslations('projects');

  if (projects.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{t('projectsEmpty')}</p>
    );
  }

  return (
    <ul className="space-y-4">
      {projects.map((p) => {
        const budgetArs = p.budget_ars ? Number(p.budget_ars) : null;
        const budgetUsd = p.budget_usd ? Number(p.budget_usd) : null;
        const ratioArs =
          budgetArs && budgetArs > 0 ? p.total_ars / budgetArs : null;
        const ratioUsd =
          budgetUsd && budgetUsd > 0 ? p.total_usd / budgetUsd : null;
        const isOverArs = ratioArs !== null && ratioArs > 1;
        const isOverUsd = ratioUsd !== null && ratioUsd > 1;
        const isOver = isOverArs || isOverUsd;

        return (
          <li key={p.id}>
            <Link href={`/projects/${p.id}`} className="group block space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate text-sm [font-weight:500] tracking-[-0.32px] group-hover:underline">
                    {p.name}
                  </span>
                  {isOver && (
                    <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-destructive">
                      {t('overBudget')}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {tProjects('expensesCount', { count: p.expense_count })}
                </span>
              </div>
              <div className="space-y-2">
                {ratioArs !== null && (
                  <BudgetRow
                    label="ARS"
                    spent={p.total_ars}
                    budget={budgetArs!}
                    ratio={ratioArs}
                    currency="ARS"
                  />
                )}
                {ratioUsd !== null && (
                  <BudgetRow
                    label="USD"
                    spent={p.total_usd}
                    budget={budgetUsd!}
                    ratio={ratioUsd}
                    currency="USD"
                  />
                )}
                {ratioArs === null && ratioUsd === null && (
                  <NoBudgetRow totalArs={p.total_ars} totalUsd={p.total_usd} />
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function BudgetRow({
  label,
  spent,
  budget,
  ratio,
  currency,
}: {
  label: 'ARS' | 'USD';
  spent: number;
  budget: number;
  ratio: number;
  currency: 'ARS' | 'USD';
}) {
  const t = useTranslations('dashboard');
  const pct = Math.min(100, ratio * 100);
  // ratio > 1 means we overflowed the budget; we keep the bar pinned at 100%
  // visually but switch its color to destructive + show the actual percent.
  const isOver = ratio > 1;
  const isNear = ratio >= 0.8 && ratio <= 1;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="inline-flex items-baseline gap-2 text-muted-foreground">
          <span className="uppercase tracking-wide">{label}</span>
          <span
            className={cn(
              'tabular-nums [font-weight:500]',
              isOver ? 'text-destructive' : isNear ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {Math.round(ratio * 100)}%
          </span>
          <span className="text-muted-foreground">{t('ofBudget')}</span>
        </span>
        <span className="tabular-nums text-foreground">
          {formatCurrency(spent, currency)}
          <span className="ml-1 text-muted-foreground">
            / {formatCurrency(budget, currency)}
          </span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isOver ? 'bg-destructive' : isNear ? 'bg-accent' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function NoBudgetRow({ totalArs, totalUsd }: { totalArs: number; totalUsd: number }) {
  // Project without a budget — just print the running totals so the card
  // still communicates something useful instead of showing a blank row.
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 text-[11px] tabular-nums text-muted-foreground">
      {totalArs > 0 && <span>{formatCurrency(totalArs, 'ARS')}</span>}
      {totalUsd > 0 && <span>{formatCurrency(totalUsd, 'USD')}</span>}
      {totalArs === 0 && totalUsd === 0 && (
        <span>{formatCurrency(0, 'ARS')}</span>
      )}
    </div>
  );
}
