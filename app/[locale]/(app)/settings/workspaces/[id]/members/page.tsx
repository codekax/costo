import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createServerClient } from '@/lib/supabase/server';
import { getWorkspaceById } from '@/lib/db/queries/workspaces';
import { getWorkspaceMembers, getPendingInvitations } from '@/lib/db/queries/members';
import { MembersList } from './members-list';
import { PendingInvitationsList } from './pending-invitations-list';
import { InviteMemberDialog } from './invite-member-dialog';

export default async function MembersPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('workspaces');

  const supabase = await createServerClient();
  const ws = await getWorkspaceById(supabase, id);
  if (!ws || ws.kind === 'personal') notFound();

  const [members, pending] = await Promise.all([
    getWorkspaceMembers(supabase, id),
    getPendingInvitations(supabase, id),
  ]);

  const isOwner = ws.role === 'owner';
  const memberCount = members.length;
  const pendingCount = pending.length;
  const remaining = Math.max(0, 10 - memberCount - pendingCount);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[36px] leading-[1.22] tracking-[-0.72px] [font-weight:500]">{t('membersTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('memberCount', { name: ws.name, members: memberCount })}
            {pendingCount > 0 && ` · ${t('pendingCount', { count: pendingCount })}`}
            {' · '}
            {t('slotsAvailable', { count: remaining })}
          </p>
        </div>
        {isOwner && remaining > 0 && <InviteMemberDialog workspaceId={id} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('activeMembers')}</CardTitle>
        </CardHeader>
        <CardContent>
          <MembersList workspaceId={id} members={members} canManage={isOwner} />
        </CardContent>
      </Card>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('pendingInvitations')}</CardTitle>
            <CardDescription>{t('invitationsExpire')}</CardDescription>
          </CardHeader>
          <CardContent>
            <PendingInvitationsList invitations={pending} canManage={isOwner} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
