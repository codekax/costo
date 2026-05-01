import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectEditForm } from '@/components/forms/project-edit-form';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { getProjectById } from '@/lib/db/queries/projects';

export default async function EditProjectPage({
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar proyecto</h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectEditForm project={project} />
        </CardContent>
      </Card>
    </div>
  );
}
