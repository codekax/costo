import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t('title')}
        description={t('pageDescription')}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoriesList workspaceId={workspace.id} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
