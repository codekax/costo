import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getExpenseById } from '@/lib/db/queries/expenses';
import { formatCurrency, formatDate } from '@/utils/format';

import { DeleteExpenseButton } from './delete-expense-button';

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('expenses');

  const { workspace, supabase } = await requireWorkspaceContext();
  const expense = await getExpenseById(supabase, id);
  if (!expense || expense.workspace_id !== workspace.id) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[36px] leading-[1.22] tracking-[-0.72px] [font-weight:500]">
            {expense.description || t('detailFallbackTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(expense.paid_at)} ·{' '}
            <Badge
              variant="outline"
              style={{ borderColor: expense.category.color, color: expense.category.color }}
            >
              {expense.category.name}
            </Badge>
          </p>
        </div>
        <DeleteExpenseButton id={id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('amountSectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-3xl tabular-nums tracking-[-0.03em] [font-weight:540]">
            {formatCurrency(Number(expense.amount), expense.currency)}
          </p>
          <p className="text-sm tabular-nums text-muted-foreground">
            ≈{' '}
            {expense.currency === 'USD'
              ? formatCurrency(Number(expense.amount_ars), 'ARS')
              : formatCurrency(Number(expense.amount_usd), 'USD')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('rateUsed')}{' '}
            <span className="tabular-nums">
              {Number(expense.fx_rate_used).toLocaleString('es-AR', {
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('detailsSectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label={t('fieldProject')} value={expense.project?.name ?? t('rowProjectGeneral')} />
          <Row label={t('fieldVendor')} value={expense.vendor?.name ?? t('fieldEmpty')} />
          {expense.notes && <Row label={t('fieldNotes')} value={expense.notes} />}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
