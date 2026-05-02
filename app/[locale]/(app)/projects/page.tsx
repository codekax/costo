import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Folder, Archive } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getProjects } from '@/lib/db/queries/projects';
import { formatCurrency } from '@/utils/format';

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('projects');

  const { workspace, supabase } = await requireWorkspaceContext();
  const projects = await getProjects(supabase, workspace.id, { archived: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={
          projects.length === 0
            ? t('noProjectsYet')
            : t('summaryActive', { count: projects.length })
        }
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/projects/archived">
                <Archive className="mr-1 size-4" /> {t('archived')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-1 size-4" /> {t('newProject')}
              </Link>
            </Button>
          </>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={Folder}
          title={t('emptyTitle')}
          description={t('emptyDescription')}
          action={
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="mr-1 size-4" /> {t('createProject')}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const progressArs =
              p.budget_ars && Number(p.budget_ars) > 0
                ? Math.min(100, (p.total_ars / Number(p.budget_ars)) * 100)
                : null;
            const progressUsd =
              p.budget_usd && Number(p.budget_usd) > 0
                ? Math.min(100, (p.total_usd / Number(p.budget_usd)) * 100)
                : null;
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full transition-colors hover:bg-foreground/5">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge variant="outline" className="capitalize">
                        {p.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{t('totalArs')}</p>
                        <p className="truncate text-base [font-weight:540] tabular-nums tracking-[-0.01em]">
                          {formatCurrency(p.total_ars, 'ARS')}
                        </p>
                        {progressArs !== null && (
                          <Progress value={progressArs} className="mt-1 h-1" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{t('totalUsd')}</p>
                        <p className="truncate text-base [font-weight:540] tabular-nums tracking-[-0.01em]">
                          {formatCurrency(p.total_usd, 'USD')}
                        </p>
                        {progressUsd !== null && (
                          <Progress value={progressUsd} className="mt-1 h-1" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('expensesCount', { count: p.expense_count })}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
