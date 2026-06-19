import { setRequestLocale, getTranslations } from 'next-intl/server';

import { PageTitle } from '@/components/layout/page-title';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getCategories } from '@/lib/db/queries/categories';

import { CategoriesList } from './categories-list';

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('categories');

  const { workspace, supabase } = await requireWorkspaceContext();
  const categories = await getCategories(supabase, workspace.id);

  return (
    <div className="space-y-6">
      <PageTitle>{t('title')}</PageTitle>
      <CategoriesList workspaceId={workspace.id} categories={categories} />
    </div>
  );
}
