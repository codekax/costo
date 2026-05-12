import Link from 'next/link';
import { setRequestLocale, getTranslations, getLocale } from 'next-intl/server';
import { Users2, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserWorkspaces } from '@/lib/db/queries/workspaces';
import { CreateWorkspaceDialog } from './create-workspace-dialog';

export default async function WorkspacesSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('workspaces');
  const intlLocale = await getLocale();

  const supabase = await createServerClient();
  const workspaces = await getCurrentUserWorkspaces(supabase);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={<CreateWorkspaceDialog />}
      />

      <div className="grid gap-3">
        {workspaces.map((ws) => (
          <Link key={ws.id} href={`/settings/workspaces/${ws.id}`}>
            <Card className="transition-colors hover:bg-foreground/5">
              <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    {ws.kind === 'personal' ? (
                      <User className="size-4" />
                    ) : (
                      <Users2 className="size-4" />
                    )}
                  </span>
                  <div>
                    <CardTitle className="text-base">{ws.name}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {ws.kind === 'personal' ? t('kindPersonal') : t('kindShared')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {ws.role}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {t('createdAt', { date: new Date(ws.created_at).toLocaleDateString(intlLocale) })}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
