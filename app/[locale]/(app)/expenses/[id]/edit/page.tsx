import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTitle } from '@/components/layout/page-title';
import { ExpenseForm } from '@/components/forms/expense-form';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getExpenseById } from '@/lib/db/queries/expenses';
import { getProjects } from '@/lib/db/queries/projects';
import { getCategories } from '@/lib/db/queries/categories';
import { getVendors } from '@/lib/db/queries/vendors';

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('expenses');

  const { workspace, supabase } = await requireWorkspaceContext();
  const [expense, projects, categories, vendors] = await Promise.all([
    getExpenseById(supabase, id),
    getProjects(supabase, workspace.id),
    getCategories(supabase, workspace.id),
    getVendors(supabase, workspace.id),
  ]);

  if (!expense || expense.workspace_id !== workspace.id) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{t('editExpense')}</PageTitle>
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
            expense={expense}
          />
        </CardContent>
      </Card>
    </div>
  );
}
