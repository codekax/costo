import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Users2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTitle } from '@/components/layout/page-title';
import { createServerClient } from '@/lib/supabase/server';
import { getWorkspaceById } from '@/lib/db/queries/workspaces';
import { WorkspaceSettingsForm } from './workspace-settings-form';
import { WorkspaceDangerZone } from './workspace-danger-zone';

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('workspaces');

  const supabase = await createServerClient();
  const ws = await getWorkspaceById(supabase, id);
  if (!ws) notFound();

  const isOwner = ws.role === 'owner';
  const isPersonal = ws.kind === 'personal';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageTitle>{ws.name}</PageTitle>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {ws.kind}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {ws.role}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href="/settings/workspaces" className="hover:text-foreground">
              {t('backToList')}
            </Link>
          </p>
        </div>
        {!isPersonal && (
          <Button asChild variant="outline" className="self-start sm:self-auto">
            <Link href={`/settings/workspaces/${id}/members`}>
              <Users2 className="mr-1 size-4" /> {t('members')}
            </Link>
          </Button>
        )}
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settingsInfoTitle')}</CardTitle>
            <CardDescription>{t('settingsInfoDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <WorkspaceSettingsForm id={id} name={ws.name} />
          </CardContent>
        </Card>
      )}

      {!isPersonal && (
        <WorkspaceDangerZone
          id={id}
          name={ws.name}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
