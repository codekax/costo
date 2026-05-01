import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getCategories } from '@/lib/db/queries/categories';
import { CategoriesList } from './categories-list';

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();
  const categories = await getCategories(supabase, ws.active.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Clasificá tus gastos. Las categorías son por workspace.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoriesList workspaceId={ws.active.id} categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
