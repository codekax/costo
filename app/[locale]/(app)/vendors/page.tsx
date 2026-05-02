import { setRequestLocale, getTranslations } from 'next-intl/server';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { requireWorkspaceContext } from '@/lib/workspace-context';
import { getVendors } from '@/lib/db/queries/vendors';

import { VendorsList } from './vendors-list';

export default async function VendorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('vendors');

  const { workspace, supabase } = await requireWorkspaceContext();
  const vendors = await getVendors(supabase, workspace.id);

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
          <VendorsList workspaceId={workspace.id} vendors={vendors} />
        </CardContent>
      </Card>
    </div>
  );
}
