import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { FileSpreadsheet, Plus, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTitle } from '@/components/layout/page-title';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryDonut } from '@/components/charts/category-donut';
import { MonthlyEvolution } from '@/components/charts/monthly-evolution';
import { ProjectProgressList } from '@/components/charts/project-progress';
import { ExpenseTable } from '@/components/domain/expense-table';

import { TotalCard } from '@/components/dashboard/total-card';
import { PeriodSelector } from '@/components/dashboard/period-selector';
import { InsightsBanner } from '@/components/dashboard/insights-banner';
import { BudgetAlerts } from '@/components/dashboard/budget-alerts';
import { QuickAddExpense } from '@/components/dashboard/quick-add';

import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getDashboardData } from '@/lib/db/queries/dashboard';
import { getProjects } from '@/lib/db/queries/projects';
import { getCategories } from '@/lib/db/queries/categories';
import { parseDashboardPeriod } from '@/lib/dashboard-period';

/**
 * Dashboard composition:
 *  - PageHeader + PeriodSelector
 *  - BudgetAlerts (only if any project >80% utilisation)
 *  - InsightsBanner (rule-based, hides itself when nothing meaningful)
 *  - TotalCard ×2 with delta vs prev period + 12-week sparkline
 *  - QuickAddExpense (no-op when no categories yet)
 *  - Category donut + monthly evolution (with forecast)
 *  - Project progress + Top movers
 *  - Top vendors + recent expenses
 *
 * All sections are RSC except PeriodSelector and QuickAddExpense which need
 * interactivity. The page itself stays under the 150-line limit by keeping
 * derivation logic in the dashboard query and presentation in components.
 */
export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');
  const tExp = await getTranslations('expenses');

  const period = parseDashboardPeriod(sp.period);
  const { workspace, supabase } = await requireWorkspaceContext();
  const [data, projects, categories] = await Promise.all([
    getDashboardData(supabase, workspace.id, period),
    getProjects(supabase, workspace.id, { archived: false }),
    getCategories(supabase, workspace.id),
  ]);

  const isEmpty = data.totals.count === 0 && period === 'all';
  const sparkArs = data.weekly.map((w) => w.ars);
  const sparkUsd = data.weekly.map((w) => w.usd);

  return (
    <div className="space-y-6">
      <PageTitle>{t('title')}</PageTitle>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodSelector value={period} />
        <Button asChild>
          <Link href="/expenses/new">
            <Plus className="mr-1 size-4" /> {tExp('newExpense')}
          </Link>
        </Button>
      </div>

      <BudgetAlerts projects={projects} />

      <InsightsBanner
        byCategory={data.byCategory}
        topVendors={data.topVendors}
        totals={data.totals}
        forecast={data.forecast}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TotalCard
          label={t('totalArs')}
          amount={data.totals.ars}
          previous={data.prevTotals?.ars ?? null}
          currency="ARS"
          spark={sparkArs}
        />
        <TotalCard
          label={t('totalUsd')}
          amount={data.totals.usd}
          previous={data.prevTotals?.usd ?? null}
          currency="USD"
          spark={sparkUsd}
        />
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Receipt}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link href="/expenses/new">
                  <Plus className="mr-1 size-4" /> {t('loadFirst')}
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/import">
                  <FileSpreadsheet className="mr-1 size-4" /> {t('importExcel')}
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <QuickAddExpense
            workspaceId={workspace.id}
            categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="reveal">
              <CardHeader>
                <CardTitle className="text-base">{t('byCategory')}</CardTitle>
                <CardDescription>{t('last12Months')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ars">
                  <TabsList className="mb-3">
                    <TabsTrigger value="ars">ARS</TabsTrigger>
                    <TabsTrigger value="usd">USD</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ars">
                    <CategoryDonut data={data.byCategory} currency="ARS" />
                  </TabsContent>
                  <TabsContent value="usd">
                    <CategoryDonut data={data.byCategory} currency="USD" />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="reveal">
              <CardHeader>
                <CardTitle className="text-base">{t('monthlyTitle')}</CardTitle>
                <CardDescription>{t('monthlyDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ars">
                  <TabsList className="mb-3">
                    <TabsTrigger value="ars">ARS</TabsTrigger>
                    <TabsTrigger value="usd">USD</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ars">
                    <MonthlyEvolution
                      data={data.monthly}
                      forecast={data.forecast}
                      currency="ARS"
                    />
                  </TabsContent>
                  <TabsContent value="usd">
                    <MonthlyEvolution
                      data={data.monthly}
                      forecast={data.forecast}
                      currency="USD"
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <Card className="reveal">
            <CardHeader>
              <CardTitle className="text-base">{t('activeProjects')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectProgressList projects={projects} />
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base [font-weight:590] tracking-[-0.01em]">
                {t('recentExpenses')}
              </h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/expenses">{t('viewAll')}</Link>
              </Button>
            </div>
            <ExpenseTable expenses={data.recent} />
          </section>
        </>
      )}
    </div>
  );
}
