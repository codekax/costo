import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getProjectById, getProjectTotals } from '@/lib/db/queries/projects';
import { getExpenses } from '@/lib/db/queries/expenses';
import { ExpenseRow } from '@/components/domain/expense-row';
import { formatCurrency, formatDate } from '@/utils/format';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();
  const project = await getProjectById(supabase, id);
  if (!project || project.workspace_id !== ws.active.id) notFound();

  const [totals, expenses] = await Promise.all([
    getProjectTotals(supabase, id),
    getExpenses(supabase, ws.active.id, { projectId: id }, 50),
  ]);

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
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="outline" className="capitalize">
              {project.type}
            </Badge>
            {project.archived_at && <Badge variant="secondary">Archivado</Badge>}
          </div>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
          )}
          {(project.start_date || project.end_date) && (
            <p className="mt-1 text-xs text-muted-foreground">
              {project.start_date ? formatDate(project.start_date) : '—'}
              {project.end_date ? ` → ${formatDate(project.end_date)}` : ''}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href={`/expenses/new?project=${id}`}>
            <Plus className="mr-1 size-4" /> Nuevo gasto
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total ARS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold tabular-nums">
              {formatCurrency(totals.ars, 'ARS')}
            </p>
            {project.budget_ars && Number(project.budget_ars) > 0 && (
              <>
                <Progress value={progressArs ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Presupuesto: {formatCurrency(Number(project.budget_ars), 'ARS')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total USD</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold tabular-nums">
              {formatCurrency(totals.usd, 'USD')}
            </p>
            {project.budget_usd && Number(project.budget_usd) > 0 && (
              <>
                <Progress value={progressUsd ?? 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Presupuesto: {formatCurrency(Number(project.budget_usd), 'USD')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gastos del proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin gastos cargados todavía.
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
