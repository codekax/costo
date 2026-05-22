import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { createServerClient } from '@/lib/supabase/server';
import { ProfileForm } from './profile-form';
import { ThemeToggle } from '@/components/settings/theme-toggle';
import { LanguagePicker } from '@/components/settings/language-picker';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('settings');

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const meta = (user.user_metadata ?? {}) as {
    name?: string;
    locale?: string;
    timezone?: string;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t('profileTitle')} description={user.email} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profileSection')}</CardTitle>
          <CardDescription>
            {t('profileSectionDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultName={meta.name ?? ''}
            defaultTimezone={meta.timezone ?? 'America/Argentina/Buenos_Aires'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('languageTitle')}</CardTitle>
          <CardDescription>{t('languageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguagePicker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('appearanceTitle')}</CardTitle>
          <CardDescription>{t('appearanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
