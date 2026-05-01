import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExpenseForm } from '@/components/forms/expense-form';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { createServerClient } from '@/lib/supabase/server';
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
  const { locale } = await params;
  const { project } = await searchParams;
  setRequestLocale(locale);

  const ws = await getActiveWorkspace();
  if (!ws) return null;

  const supabase = await createServerClient();
  const [projects, categories, vendors] = await Promise.all([
    getProjects(supabase, ws.active.id),
    getCategories(supabase, ws.active.id),
    getVendors(supabase, ws.active.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo gasto</h1>
        <p className="text-sm text-muted-foreground">Workspace: {ws.active.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del gasto</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            workspaceId={ws.active.id}
            projects={projects.map((p) => ({ id: p.id, name: p.name }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
            vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
            defaultProjectId={project ?? null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
