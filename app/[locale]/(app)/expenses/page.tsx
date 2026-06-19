import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTitle } from '@/components/layout/page-title';
import { ExpenseTable } from '@/components/domain/expense-table';
import { FilterBar } from '@/components/domain/filter-bar';
import { SearchInput } from '@/components/domain/search-input';
import { ExportCsvButton } from '@/components/domain/export-csv-button';

import { requireWorkspaceContext } from '@/lib/workspace-context';
import { parseExpenseFiltersFromObject } from '@/lib/expense-filters';
import { getExpenses, getWorkspaceTotals } from '@/lib/db/queries/expenses';
import { getProjects } from '@/lib/db/queries/projects';
import { getCategories } from '@/lib/db/queries/categories';
import { formatCurrency } from '@/utils/format';
import { EXPENSE_LIST_DEFAULT_LIMIT } from '@/constants/expenses';

import { ExpensesScopeTabs } from './expenses-scope-tabs';

type SearchParams = {
  scope?: string;
  category?: string;
  vendor?: string;
  currency?: string;
  from?: string;
  to?: string;
  q?: string;
};

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations('expenses');
  const tScope = await getTranslations('scopeTabs');

  const { workspace, supabase } = await requireWorkspaceContext();
  const { scope, filters, hasFilters } = parseExpenseFiltersFromObject(sp);

  const [expenses, totals, projects, categories] = await Promise.all([
    getExpenses(supabase, workspace.id, filters, EXPENSE_LIST_DEFAULT_LIMIT * 2),
    getWorkspaceTotals(supabase, workspace.id),
    getProjects(supabase, workspace.id, { archived: false }),
    getCategories(supabase, workspace.id),
  ]);

  const scopedTotals = expenses.reduce(
    (acc, e) => {
      acc.ars += Number(e.amount_ars);
      acc.usd += Number(e.amount_usd);
      return acc;
    },
    { ars: 0, usd: 0 },
  );

  const scoped = scope.kind !== 'all' || hasFilters;
  const label =
    scope.kind === 'all'
      ? tScope('all')
      : scope.kind === 'general'
        ? tScope('general')
        : (projects.find((p) => p.id === scope.projectId)?.name ?? '');

  const description = scoped
    ? scope.kind !== 'all'
      ? t('scopedSummary', {
          label,
          count: expenses.length,
          ars: formatCurrency(scopedTotals.ars, 'ARS'),
          usd: formatCurrency(scopedTotals.usd, 'USD'),
        })
      : t('summary', {
          count: expenses.length,
          ars: formatCurrency(scopedTotals.ars, 'ARS'),
          usd: formatCurrency(scopedTotals.usd, 'USD'),
        })
    : t('summary', {
        count: totals.count,
        ars: formatCurrency(totals.ars, 'ARS'),
        usd: formatCurrency(totals.usd, 'USD'),
      });

  const newExpenseHref =
    scope.kind === 'project' ? `/expenses/new?project=${scope.projectId}` : '/expenses/new';

  return (
    <div className="space-y-6">
      <PageTitle>{t('title')}</PageTitle>

      <div className="space-y-2">
        {/* Search + primary action — always one tidy row */}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SearchInput />
          </div>
          <Button asChild className="shrink-0">
            <Link href="/expenses/new">
              <Plus className="mr-1 size-4" /> {t('newExpense')}
            </Link>
          </Button>
        </div>
        {/* Scope + filters + export — horizontal scroll on mobile, wrap on desktop */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          <ExpensesScopeTabs
            scope={scope}
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
          />
          <FilterBar
            categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
          />
          <ExportCsvButton workspaceId={workspace.id} className="sm:ml-auto" />
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground">{description}</p>

      {expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={
            hasFilters
              ? t('emptyFilteredTitle')
              : scope.kind === 'all'
                ? t('emptyTitle')
                : t('emptyForScope', { label })
          }
          description={
            hasFilters ? t('emptyFilteredDescription') : t('emptyDescription')
          }
          action={
            !hasFilters ? (
              <Button asChild>
                <Link href={newExpenseHref}>
                  <Plus className="mr-1 size-4" /> {t('loadExpense')}
                </Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <ExpenseTable expenses={expenses} />
      )}
    </div>
  );
}
