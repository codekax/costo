import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getExpenses, getWorkspaceTotals } from '@/lib/db/queries/expenses';
import { getProjects } from '@/lib/db/queries/projects';
import { ExpenseRow } from '@/components/domain/expense-row';
import { ExpensesScopeTabs } from './expenses-scope-tabs';
import { formatCurrency } from '@/utils/format';

type Scope = 'all' | 'general' | string;

function parseScope(value: string | undefined): Scope {
  if (!value) return 'all';
  if (value === 'general') return 'general';
  if (value === 'all') return 'all';
  return value;
}

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scope?: string }>;
}) {
  const { locale } = await params;
  const { scope: scopeRaw } = await searchParams;
  setRequestLocale(locale);

  const scope = parseScope(scopeRaw);
  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();

  const filters =
    scope === 'all'
      ? {}
      : scope === 'general'
      ? { projectId: null as string | null }
      : { projectId: scope };

  const [expenses, totals, projects] = await Promise.all([
    getExpenses(supabase, ws.active.id, filters, 100),
    getWorkspaceTotals(supabase, ws.active.id),
    getProjects(supabase, ws.active.id, { archived: false }),
  ]);

  // Compute scoped totals (totals query above is workspace-wide)
  const scopedAccumulator = expenses.reduce(
    (acc, e) => {
      acc.ars += Number(e.amount_ars);
      acc.usd += Number(e.amount_usd);
      return acc;
    },
    { ars: 0, usd: 0 },
  );

  const scopeLabel =
    scope === 'all'
      ? 'Todos'
      : scope === 'general'
      ? 'Generales'
      : projects.find((p) => p.id === scope)?.name ?? 'Proyecto';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            {scope === 'all' ? (
              <>
                {totals.count} gasto{totals.count === 1 ? '' : 's'} ·{' '}
                {formatCurrency(totals.ars, 'ARS')} · {formatCurrency(totals.usd, 'USD')}
              </>
            ) : (
              <>
                {scopeLabel} · {expenses.length} gasto{expenses.length === 1 ? '' : 's'} ·{' '}
                {formatCurrency(scopedAccumulator.ars, 'ARS')} ·{' '}
                {formatCurrency(scopedAccumulator.usd, 'USD')}
              </>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="mr-1 size-4" /> Nuevo gasto
          </Link>
        </Button>
      </div>

      <ExpensesScopeTabs
        scope={scope}
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
      />

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Receipt className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {scope === 'all' ? 'Sin gastos todavía' : `Sin gastos en ${scopeLabel}`}
              </p>
              <p className="text-sm text-muted-foreground">Cargá uno para empezar.</p>
            </div>
            <Button asChild>
              <Link
                href={
                  scope === 'general'
                    ? '/expenses/new'
                    : scope === 'all'
                    ? '/expenses/new'
                    : `/expenses/new?project=${scope}`
                }
              >
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
