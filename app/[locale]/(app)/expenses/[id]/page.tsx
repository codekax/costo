import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createServerClient } from '@/lib/supabase/server';
import { getExpenseById } from '@/lib/db/queries/expenses';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { formatCurrency, formatDate } from '@/utils/format';
import { DeleteExpenseButton } from './delete-expense-button';

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();
  const expense = await getExpenseById(supabase, id);
  if (!expense || expense.workspace_id !== ws.active.id) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {expense.description || 'Gasto'}
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
          <CardTitle className="text-base">Monto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-3xl font-bold tabular-nums">
            {formatCurrency(Number(expense.amount), expense.currency)}
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>Equiv. ARS: {formatCurrency(Number(expense.amount_ars), 'ARS')}</span>
            <span>Equiv. USD: {formatCurrency(Number(expense.amount_usd), 'USD')}</span>
            <span>Tasa usada: {Number(expense.fx_rate_used)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Proyecto" value={expense.project?.name ?? 'Generales'} />
          <Row label="Proveedor" value={expense.vendor?.name ?? '—'} />
          {expense.notes && <Row label="Notas" value={expense.notes} />}
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
