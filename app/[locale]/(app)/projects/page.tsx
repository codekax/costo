import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Folder, Archive } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTitle } from '@/components/layout/page-title';
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
  const tCommon = await getTranslations('common');

  const { workspace, supabase } = await requireWorkspaceContext();
  const projects = await getProjects(supabase, workspace.id, { archived: false });

  return (
    <div className="space-y-6">
      <PageTitle>{t('title')}</PageTitle>

      <div className="flex flex-wrap items-center justify-end gap-2">
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
      </div>

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
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('name')}</TableHead>
                <TableHead>{t('colType')}</TableHead>
                <TableHead className="text-right">{t('totalArs')}</TableHead>
                <TableHead className="text-right">{t('totalUsd')}</TableHead>
                <TableHead className="text-right">{t('colExpenses')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id} className="group relative cursor-pointer">
                  <TableCell className="[font-weight:510] text-foreground">
                    <Link
                      href={`/projects/${p.id}`}
                      className="absolute inset-0"
                      aria-label={p.name}
                    />
                    <span className="group-hover:underline">{p.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {p.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.total_ars, 'ARS')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.total_usd, 'USD')}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {p.expense_count}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTable>
      )}
    </div>
  );
}
