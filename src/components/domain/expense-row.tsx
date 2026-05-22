import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { ExpenseWithRelations } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/format';
import { ExpenseRowActions } from '@/components/domain/expense-row-actions';

/**
 * iOS Wallet / Stocks-style expense row:
 *  - Leading category swatch (tinted circle, color from category)
 *  - Title (description fallback to category name) + secondary line
 *    (date · category · vendor · project)
 *  - Trailing amount in display weight + currency conversion in subtle text
 *  - Chevron right indicates drill-in
 *  - Row actions menu sits above the chevron, accessible via hover/focus
 *
 * The whole row is a Link via an overlay (`inset-0`) so the click target
 * is generous. Inner content has `pointer-events-none` so clicks fall
 * through to the link; the actions menu re-enables pointer-events.
 */
export function ExpenseRow({ expense }: { expense: ExpenseWithRelations }) {
  const t = useTranslations('expenses');

  return (
    <div
      className="group cv-row relative flex items-center gap-3 rounded-2xl bg-card px-4 py-3 transition-colors hover:bg-muted/60"
      style={{ viewTransitionName: `expense-${expense.id}` }}
    >
      <Link
        href={`/expenses/${expense.id}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={expense.description || expense.category.name}
      />

      {/* Leading swatch — iOS Reminders style, category color in 36px circle */}
      <div
        className="pointer-events-none relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${expense.category.color}22` }}
        aria-hidden
      >
        <span
          className="size-3 rounded-full"
          style={{ backgroundColor: expense.category.color }}
        />
      </div>

      {/* Title + secondary metadata */}
      <div className="pointer-events-none relative z-10 min-w-0 flex-1">
        <p className="truncate text-[15px] leading-[1.27] [font-weight:600] tracking-[-0.01em] text-foreground">
          {expense.description || expense.category.name}
        </p>
        <p className="mt-0.5 truncate text-[13px] leading-[1.23] text-muted-foreground">
          {formatDate(expense.paid_at)} · {expense.category.name}
          {expense.vendor ? ` · ${expense.vendor.name}` : ''}
          {expense.project ? ` · ${expense.project.name}` : ` · ${t('rowProjectGeneral')}`}
        </p>
      </div>

      {/* Trailing amount stack */}
      <div className="pointer-events-none relative z-10 flex shrink-0 flex-col items-end gap-0.5">
        <span className="tabular-nums text-[15px] [font-weight:600] tracking-[-0.01em] text-foreground">
          {formatCurrency(Number(expense.amount), expense.currency)}
        </span>
        <span className="tabular-nums text-[12px] text-muted-foreground">
          ≈{' '}
          {expense.currency === 'USD'
            ? formatCurrency(Number(expense.amount_ars), 'ARS')
            : formatCurrency(Number(expense.amount_usd), 'USD')}
        </span>
      </div>

      {/* Actions + chevron */}
      <div className="relative z-10 flex shrink-0 items-center gap-1">
        <ExpenseRowActions id={expense.id} />
        <ChevronRight
          className="pointer-events-none size-4 text-muted-foreground/60"
          aria-hidden
        />
      </div>
    </div>
  );
}
