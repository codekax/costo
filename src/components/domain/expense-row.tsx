import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { ExpenseWithRelations } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { ExpenseRowActions } from '@/components/domain/expense-row-actions';

/**
 * Whole row clickable via overlay <Link> (absolute inset-0). Inner content has
 * `pointer-events-none` so clicks fall through; the actions dropdown re-enables
 * pointer events and stops propagation so it stays interactive.
 */
export function ExpenseRow({ expense }: { expense: ExpenseWithRelations }) {
  const t = useTranslations('expenses');
  return (
    <div className="group relative flex items-center justify-between gap-4 rounded-md border border-border bg-card px-4 py-4 transition-colors hover:bg-foreground/[0.03]">
      <Link
        href={`/expenses/${expense.id}`}
        className="absolute inset-0 z-0 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={expense.description || expense.category.name}
      />

      <div className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-start gap-3">
        <span
          className="mt-2 size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: expense.category.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base [font-weight:500] tracking-[-0.32px]">
            {expense.description || expense.category.name}
          </p>
          <p className="truncate text-xs text-muted-foreground [font-weight:450]">
            {formatDate(expense.paid_at)} · {expense.category.name}
            {expense.vendor ? ` · ${expense.vendor.name}` : ''}
            {expense.project ? ` · ${expense.project.name}` : ` · ${t('rowProjectGeneral')}`}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <div className="pointer-events-none flex flex-col items-end gap-1">
          <span className="text-base [font-weight:500] tracking-[-0.32px] tabular-nums">
            {formatCurrency(Number(expense.amount), expense.currency)}
          </span>
          <Badge variant="secondary" className="text-xs tabular-nums">
            ≈{' '}
            {expense.currency === 'USD'
              ? formatCurrency(Number(expense.amount_ars), 'ARS')
              : formatCurrency(Number(expense.amount_usd), 'USD')}
          </Badge>
        </div>
        <ExpenseRowActions id={expense.id} />
      </div>
    </div>
  );
}
