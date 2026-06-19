import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageTitle } from '@/components/layout/page-title';
import { ProjectForm } from '@/components/forms/project-form';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getProjectTypes } from '@/lib/db/queries/project-types';

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('projects');
  const { workspace, supabase } = await requireWorkspaceContext();
  const existingTypes = await getProjectTypes(supabase, workspace.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle>{t('newProject')}</PageTitle>
      <Card>
        <CardHeader>
          <CardTitle>{t('formCardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm workspaceId={workspace.id} existingTypes={existingTypes} />
        </CardContent>
      </Card>
    </div>
  );
}
