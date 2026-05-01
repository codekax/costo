import Link from 'next/link';
import type { ExpenseWithRelations } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/format';
import { Badge } from '@/components/ui/badge';

export function ExpenseRow({ expense }: { expense: ExpenseWithRelations }) {
  return (
    <Link
      href={`/expenses/${expense.id}`}
      className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-3 transition-colors hover:bg-accent/40"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className="mt-1.5 size-2 shrink-0 rounded-full"
          style={{ backgroundColor: expense.category.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {expense.description || expense.category.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {formatDate(expense.paid_at)} · {expense.category.name}
            {expense.vendor ? ` · ${expense.vendor.name}` : ''}
            {expense.project ? ` · ${expense.project.name}` : ' · Generales'}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(Number(expense.amount), expense.currency)}
        </span>
        {expense.currency === 'USD' && (
          <Badge variant="secondary" className="text-xs">
            ≈ {formatCurrency(Number(expense.amount_ars), 'ARS')}
          </Badge>
        )}
      </div>
    </Link>
  );
}
