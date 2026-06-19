import { notFound } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PageTitle } from '@/components/layout/page-title';
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
      <PageTitle>{t('membersTitle')}</PageTitle>

      {isOwner && remaining > 0 ? (
        <div className="flex justify-end">
          <InviteMemberDialog workspaceId={id} />
        </div>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-sm [font-weight:510] text-muted-foreground">
          {t('activeMembers')}
        </h2>
        <MembersList workspaceId={id} members={members} canManage={isOwner} />
      </section>

      {pending.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm [font-weight:510] text-muted-foreground">
            {t('pendingInvitations')}
          </h2>
          <PendingInvitationsList invitations={pending} canManage={isOwner} />
        </section>
      )}
    </div>
  );
}
