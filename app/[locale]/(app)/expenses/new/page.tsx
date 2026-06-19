import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Plus, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageTitle } from '@/components/layout/page-title';
import { ExpenseForm } from '@/components/forms/expense-form';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getProjects } from '@/lib/db/queries/projects';
import { getCategories } from '@/lib/db/queries/categories';
import { getVendors } from '@/lib/db/queries/vendors';

export default async function NewExpensePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ project?: string }>;
}) {
  const [{ locale }, { project }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations('expenses');

  const { workspace, supabase } = await requireWorkspaceContext();
  const [projects, categories, vendors] = await Promise.all([
    getProjects(supabase, workspace.id),
    getCategories(supabase, workspace.id),
    getVendors(supabase, workspace.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{t('newExpense')}</PageTitle>
      {categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={t('noCategoriesTitle')}
          description={t('noCategoriesDescription')}
          action={
            <Button asChild>
              <Link href="/categories">
                <Plus className="mr-1 size-4" /> {t('createCategoryCta')}
              </Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('formCardTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              workspaceId={workspace.id}
              projects={projects.map((p) => ({ id: p.id, name: p.name }))}
              categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
              vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
              defaultProjectId={project ?? null}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
