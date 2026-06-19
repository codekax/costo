import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Archive } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTitle } from '@/components/layout/page-title';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getProjects } from '@/lib/db/queries/projects';
import { formatCurrency } from '@/utils/format';

export default async function ArchivedProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('projects');

  const { workspace, supabase } = await requireWorkspaceContext();
  const projects = await getProjects(supabase, workspace.id, { archived: true });

  return (
    <div className="space-y-6">
      <PageTitle>{t('archivedTitle')}</PageTitle>

      <div className="flex justify-end">
        <Button asChild variant="ghost">
          <Link href="/projects">{t('backToActive')}</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={t('archivedEmptyTitle')}
          description={t('archivedEmptyDescription')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full opacity-75 transition-opacity hover:opacity-100">
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-base [font-weight:510]">{p.name}</h3>
                    <Badge variant="secondary">{t('archivedSingle')}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t('totalArs')}</p>
                      <p className="truncate text-base [font-weight:510] tabular-nums tracking-[-0.01em]">
                        {formatCurrency(p.total_ars, 'ARS')}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{t('totalUsd')}</p>
                      <p className="truncate text-base [font-weight:510] tabular-nums tracking-[-0.01em]">
                        {formatCurrency(p.total_usd, 'USD')}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('expensesCount', { count: p.expense_count })}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
