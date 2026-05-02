import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserWorkspaces } from '@/lib/db/queries/workspaces';
import { DeleteAccountSection } from './delete-account-section';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('settings');
  const tExp = await getTranslations('expenses');
  const intlLocale = await getLocale();

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const workspaces = await getCurrentUserWorkspaces(supabase);
  const ownedShared = workspaces.filter(
    (w) => w.kind === 'shared' && w.owner_id === user.id,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-[36px] leading-[1.22] tracking-[-0.72px] [font-weight:500]">{t('accountTitle')}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('accountDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label={t('accountEmail')} value={user.email ?? tExp('fieldEmpty')} />
          <Row
            label={t('accountLastSignIn')}
            value={
              user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString(intlLocale)
                : tExp('fieldEmpty')
            }
          />
        </CardContent>
      </Card>

      <DeleteAccountSection
        ownedSharedWorkspaces={ownedShared.map((w) => ({ id: w.id, name: w.name }))}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
