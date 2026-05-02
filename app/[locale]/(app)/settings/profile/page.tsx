import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { ProfileForm } from './profile-form';
import { ThemeToggle } from '@/components/settings/theme-toggle';

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
      <div>
        <h1 className="text-[36px] leading-[1.22] tracking-[-0.72px] [font-weight:500]">{t('profileTitle')}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

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
            defaultLocale={(meta.locale as 'es' | 'en') ?? 'es'}
            defaultTimezone={meta.timezone ?? 'America/Argentina/Buenos_Aires'}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('appearanceTitle')}</CardTitle>
          <CardDescription>
            {t('appearanceDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
