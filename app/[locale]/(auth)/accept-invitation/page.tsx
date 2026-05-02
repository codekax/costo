import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AcceptInvitationButton } from './accept-invitation-button';
import { MagicLinkForInvitation } from './magic-link-for-invitation';

export default async function AcceptInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ locale }, { token }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations('acceptInvitation');

  if (!token) redirect('/login');

  // Lookup the invitation via admin (RLS would block non-members)
  const { data: invitation } = await supabaseAdmin
    .from('invitations')
    .select(
      `id, workspace_id, email, role, expires_at, accepted_at,
       workspace:workspaces!inner(id, name)`,
    )
    .eq('token', token)
    .maybeSingle();

  const wsName = (invitation?.workspace as unknown as { name: string } | null)?.name;

  if (!invitation || !wsName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('invalidTitle')}</CardTitle>
          <CardDescription>
            {t('invalidDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{t('goToLogin')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (invitation.accepted_at) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('alreadyTitle')}</CardTitle>
          <CardDescription>{t('alreadyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/dashboard">{t('goToDashboard')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('expiredTitle')}</CardTitle>
          <CardDescription>
            {t('expiredDescription')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Check current session
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged in but with a different email
  if (user && user.email && user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('emailMismatchTitle')}</CardTitle>
          <CardDescription>
            {t('emailMismatchDescription', { invitedEmail: invitation.email, currentEmail: user.email })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{t('switchAccount')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Logged in with the right email — single click to accept
  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('acceptTitle')}</CardTitle>
          <CardDescription>
            {t('acceptDescription', { name: wsName, role: invitation.role })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInvitationButton token={token} />
        </CardContent>
      </Card>
    );
  }

  // Not logged in — offer magic link to the invited email
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('magicLinkPromptTitle', { name: wsName })}</CardTitle>
        <CardDescription>
          {t('magicLinkPromptDescription', { email: invitation.email })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MagicLinkForInvitation email={invitation.email} token={token} />
      </CardContent>
    </Card>
  );
}
