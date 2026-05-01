import { setRequestLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectForm } from '@/components/forms/project-form';
import { getActiveWorkspace } from '@/lib/active-workspace';

export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ws = await getActiveWorkspace();
  if (!ws) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo proyecto</h1>
        <p className="text-sm text-muted-foreground">
          Workspace activo: {ws.active.name}
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Datos del proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm workspaceId={ws.active.id} />
        </CardContent>
      </Card>
    </div>
  );
}
