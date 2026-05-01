import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getExpenses, getWorkspaceTotals } from '@/lib/db/queries/expenses';
import { ExpenseRow } from '@/components/domain/expense-row';
import { formatCurrency } from '@/utils/format';

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();
  const [expenses, totals] = await Promise.all([
    getExpenses(supabase, ws.active.id, {}, 100),
    getWorkspaceTotals(supabase, ws.active.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            {totals.count} gasto{totals.count === 1 ? '' : 's'} ·{' '}
            {formatCurrency(totals.ars, 'ARS')} · {formatCurrency(totals.usd, 'USD')}
          </p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="mr-1 size-4" /> Nuevo gasto
          </Link>
        </Button>
      </div>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Receipt className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Sin gastos todavía</p>
              <p className="text-sm text-muted-foreground">
                Cargá tu primer gasto para empezar.
              </p>
            </div>
            <Button asChild>
              <Link href="/expenses/new">
                <Plus className="mr-1 size-4" /> Cargar gasto
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <ExpenseRow key={e.id} expense={e} />
          ))}
        </div>
      )}
    </div>
  );
}
