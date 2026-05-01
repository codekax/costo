import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getExpenses, getWorkspaceTotals } from '@/lib/db/queries/expenses';
import { getProjects } from '@/lib/db/queries/projects';
import { getCategories } from '@/lib/db/queries/categories';
import { getVendors } from '@/lib/db/queries/vendors';
import { ExpenseRow } from '@/components/domain/expense-row';
import { ExpensesScopeTabs } from './expenses-scope-tabs';
import { FilterBar } from '@/components/domain/filter-bar';
import { SearchInput } from '@/components/domain/search-input';
import { formatCurrency } from '@/utils/format';
import type { ExpenseFilters } from '@/lib/schemas/expense';

type Scope = 'all' | 'general' | string;

function parseScope(value: string | undefined): Scope {
  if (!value) return 'all';
  if (value === 'general') return 'general';
  if (value === 'all') return 'all';
  return value;
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
function pickDate(value: string | undefined): string | undefined {
  return value && dateRegex.test(value) ? value : undefined;
}
function pickCurrency(value: string | undefined): 'ARS' | 'USD' | undefined {
  return value === 'ARS' || value === 'USD' ? value : undefined;
}

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    scope?: string;
    category?: string;
    vendor?: string;
    currency?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const scope = parseScope(sp.scope);
  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();

  const baseFilters: ExpenseFilters = {
    ...(scope === 'general' ? { projectId: null } : {}),
    ...(scope !== 'all' && scope !== 'general' ? { projectId: scope } : {}),
    ...(sp.category ? { categoryId: sp.category } : {}),
    ...(sp.vendor ? { vendorId: sp.vendor } : {}),
    ...(pickCurrency(sp.currency) ? { currency: pickCurrency(sp.currency)! } : {}),
    ...(pickDate(sp.from) ? { dateFrom: pickDate(sp.from)! } : {}),
    ...(pickDate(sp.to) ? { dateTo: pickDate(sp.to)! } : {}),
    ...(sp.q ? { search: sp.q } : {}),
  };

  const [expenses, totals, projects, categories, vendors] = await Promise.all([
    getExpenses(supabase, ws.active.id, baseFilters, 200),
    getWorkspaceTotals(supabase, ws.active.id),
    getProjects(supabase, ws.active.id, { archived: false }),
    getCategories(supabase, ws.active.id),
    getVendors(supabase, ws.active.id),
  ]);

  const scopedAccumulator = expenses.reduce(
    (acc, e) => {
      acc.ars += Number(e.amount_ars);
      acc.usd += Number(e.amount_usd);
      return acc;
    },
    { ars: 0, usd: 0 },
  );

  const filtersActive =
    !!sp.category ||
    !!sp.vendor ||
    !!pickCurrency(sp.currency) ||
    !!pickDate(sp.from) ||
    !!pickDate(sp.to) ||
    !!sp.q;

  const showScopedHeader = scope !== 'all' || filtersActive;

  const scopeLabel =
    scope === 'all'
      ? 'Todos'
      : scope === 'general'
        ? 'Generales'
        : (projects.find((p) => p.id === scope)?.name ?? 'Proyecto');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            {showScopedHeader ? (
              <>
                {scope !== 'all' ? `${scopeLabel} · ` : ''}
                {expenses.length} gasto{expenses.length === 1 ? '' : 's'} ·{' '}
                {formatCurrency(scopedAccumulator.ars, 'ARS')} ·{' '}
                {formatCurrency(scopedAccumulator.usd, 'USD')}
              </>
            ) : (
              <>
                {totals.count} gasto{totals.count === 1 ? '' : 's'} ·{' '}
                {formatCurrency(totals.ars, 'ARS')} · {formatCurrency(totals.usd, 'USD')}
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput />
        <FilterBar
          categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        />
      </div>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Receipt className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {filtersActive
                  ? 'Ningún gasto coincide con los filtros'
                  : scope === 'all'
                    ? 'Sin gastos todavía'
                    : `Sin gastos en ${scopeLabel}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {filtersActive
                  ? 'Probá ajustar o limpiar los filtros.'
                  : 'Cargá uno para empezar.'}
              </p>
            </div>
            {!filtersActive && (
              <Button asChild>
                <Link
                  href={
                    scope !== 'all' && scope !== 'general'
                      ? `/expenses/new?project=${scope}`
                      : '/expenses/new'
                  }
                >
                  <Plus className="mr-1 size-4" /> Cargar gasto
                </Link>
              </Button>
            )}
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
