import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTitle } from '@/components/layout/page-title';
import { ProjectEditForm } from '@/components/forms/project-edit-form';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getProjectById } from '@/lib/db/queries/projects';
import { getProjectTypes } from '@/lib/db/queries/project-types';

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('projects');

  const { workspace, supabase } = await requireWorkspaceContext();
  const [project, existingTypes] = await Promise.all([
    getProjectById(supabase, id),
    getProjectTypes(supabase, workspace.id),
  ]);
  if (!project || project.workspace_id !== workspace.id) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{t('editProject')}</PageTitle>
      <Card>
        <CardHeader>
          <CardTitle>{t('formCardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectEditForm project={project} existingTypes={existingTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
