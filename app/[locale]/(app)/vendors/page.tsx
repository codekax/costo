import { setRequestLocale, getTranslations } from 'next-intl/server';

import { PageTitle } from '@/components/layout/page-title';
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
    <div className="space-y-6">
      <PageTitle>{t('title')}</PageTitle>
      <VendorsList workspaceId={workspace.id} vendors={vendors} />
    </div>
  );
}
