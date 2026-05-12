import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryDonut } from '@/components/charts/category-donut';
import { MonthlyEvolution } from '@/components/charts/monthly-evolution';
import { TopVendors } from '@/components/charts/top-vendors';
import { ProjectProgressList } from '@/components/charts/project-progress';
import { ExpenseRow } from '@/components/domain/expense-row';

import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getDashboardData } from '@/lib/db/queries/dashboard';
import { getProjects } from '@/lib/db/queries/projects';
import { getWorkspaceTotals } from '@/lib/db/queries/expenses';
import { formatCurrency } from '@/utils/format';

/**
 * Charts use recharts (~60KB). They're declared as `'use client'` components,
 * which Next.js already extracts into separate client chunks during the build.
 * Combined with `optimizePackageImports: ['recharts']` in next.config.ts,
 * this gives us bundle splitting without the `dynamic()` ergonomic cost.
 *
 * (Tried `dynamic({ ssr: false })` — Next 15 forbids it inside Server Components.
 * Wrapping each chart in a client wrapper just to call `dynamic()` is more
 * boilerplate than it's worth at this scale.)
 */

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('dashboard');
  const tExp = await getTranslations('expenses');

  const { workspace, supabase } = await requireWorkspaceContext();
  const [data, allTotals, projects] = await Promise.all([
    getDashboardData(supabase, workspace.id),
    getWorkspaceTotals(supabase, workspace.id),
    getProjects(supabase, workspace.id, { archived: false }),
  ]);

  const isEmpty = allTotals.count === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={workspace.name}
        actions={
          <Button asChild>
            <Link href="/expenses/new">
              <Plus className="mr-1 size-4" /> {tExp('newExpense')}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TotalCard label={t('totalArs')} amount={allTotals.ars} currency="ARS" />
        <TotalCard label={t('totalUsd')} amount={allTotals.usd} currency="USD" />
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Receipt}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button asChild>
              <Link href="/expenses/new">
                <Plus className="mr-1 size-4" /> {t('loadFirst')}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <Card>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('monthlyTitle')}</CardTitle>
                <CardDescription>{t('monthlyDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyEvolution data={data.monthly} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('activeProjects')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectProgressList projects={projects} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('topVendors')}</CardTitle>
                <CardDescription>{t('topVendorsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <TopVendors data={data.topVendors} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-base">{t('recentExpenses')}</CardTitle>
                <CardDescription>{t('recentExpensesDescription')}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="self-start sm:self-auto">
                <Link href="/expenses">{t('viewAll')}</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recent.map((e) => (
                <ExpenseRow key={e.id} expense={e} />
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function TotalCard({
  label,
  amount,
  currency,
}: {
  label: string;
  amount: number;
  currency: 'ARS' | 'USD';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="truncate text-2xl tabular-nums tracking-[-0.03em] [font-weight:540] sm:text-3xl">
          {formatCurrency(amount, currency)}
        </p>
      </CardContent>
    </Card>
  );
}
