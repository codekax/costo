import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getProjectById, getProjectTotals } from '@/lib/db/queries/projects';
import { getExpenses } from '@/lib/db/queries/expenses';
import { ExpenseRow } from '@/components/domain/expense-row';
import { formatCurrency, formatDate } from '@/utils/format';
import { EXPENSE_LIST_DETAIL_LIMIT } from '@/constants/expenses';

import { ProjectActions } from './project-actions';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('projects');
  const tExp = await getTranslations('expenses');

  const { workspace, supabase } = await requireWorkspaceContext();
  // Fire all three in parallel — totals + expenses don't depend on the project
  // existing; we fail-fast with notFound() afterward if the project lookup is null.
  const [project, totals, expenses] = await Promise.all([
    getProjectById(supabase, id),
    getProjectTotals(supabase, id),
    getExpenses(supabase, workspace.id, { projectId: id }, EXPENSE_LIST_DETAIL_LIMIT),
  ]);
  if (!project || project.workspace_id !== workspace.id) notFound();

  const progressArs =
    project.budget_ars && Number(project.budget_ars) > 0
      ? Math.min(100, (totals.ars / Number(project.budget_ars)) * 100)
      : null;
  const progressUsd =
    project.budget_usd && Number(project.budget_usd) > 0
      ? Math.min(100, (totals.usd / Number(project.budget_usd)) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[36px] leading-[1.22] tracking-[-0.72px] [font-weight:500]">{project.name}</h1>
            <Badge variant="outline" className="capitalize">
              {project.type}
            </Badge>
            {project.archived_at && <Badge variant="secondary">{t('archivedSingle')}</Badge>}
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
          {(project.start_date || project.end_date) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {project.start_date ? formatDate(project.start_date) : tExp('fieldEmpty')}
              {project.end_date ? ` → ${formatDate(project.end_date)}` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectActions
            id={id}
            name={project.name}
            archived={project.archived_at !== null}
          />
          <Button asChild>
            <Link href={`/expenses/new?project=${id}`}>
              <Plus className="mr-1 size-4" /> {tExp('newExpense')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalArs')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl tabular-nums tracking-[-0.03em] [font-weight:540]">
              {formatCurrency(totals.ars, 'ARS')}
            </p>
            {project.budget_ars && Number(project.budget_ars) > 0 && (
              <>
                <Progress value={progressArs ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {t('budget', { amount: formatCurrency(Number(project.budget_ars), 'ARS') })}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalUsd')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl tabular-nums tracking-[-0.03em] [font-weight:540]">
              {formatCurrency(totals.usd, 'USD')}
            </p>
            {project.budget_usd && Number(project.budget_usd) > 0 && (
              <>
                <Progress value={progressUsd ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {t('budget', { amount: formatCurrency(Number(project.budget_usd), 'USD') })}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('expensesSectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('noExpensesYet')}
            </p>
          ) : (
            <div className="space-y-2">
              {expenses.map((e) => (
                <ExpenseRow key={e.id} expense={e} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
