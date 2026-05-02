'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, ArrowRightLeft, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { removeMember } from '@/actions/workspaces/remove-member';
import { transferOwnership } from '@/actions/workspaces/transfer-ownership';
import type { WorkspaceMemberInfo } from '@/lib/db/queries/members';

export function MembersList({
  workspaceId,
  members,
  canManage,
}: {
  workspaceId: string;
  members: WorkspaceMemberInfo[];
  canManage: boolean;
}) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const t = useTranslations('workspaces');
  const [pending, startTransition] = useTransition();

  function onRemove(userId: string, name: string) {
    if (!confirm(t('removeConfirm', { name }))) return;
    startTransition(async () => {
      const result = await removeMember({ workspaceId, userId });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('memberRemoved'));
      router.refresh();
    });
  }

  function onTransfer(userId: string, name: string) {
    if (!confirm(t('transferConfirm', { name }))) return;
    startTransition(async () => {
      const result = await transferOwnership({ workspaceId, toUserId: userId });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('ownershipTransferred'));
      router.refresh();
    });
  }

  return (
    <ul className="divide-y">
      {members.map((m) => {
        const display = m.display_name ?? m.email ?? t('fallbackMember');
        const initial = (display.charAt(0) || 'M').toUpperCase();
        return (
          <li
            key={m.user_id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{display}</p>
                {m.email && m.email !== display && (
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={m.role === 'owner' ? 'default' : 'secondary'}>
                {m.role === 'owner' && <Crown className="mr-1 size-3" />}
                {m.role}
              </Badge>
              {canManage && m.role !== 'owner' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTransfer(m.user_id, display)}
                    disabled={pending}
                    aria-label={t('transferAria')}
                    title={t('transferAria')}
                  >
                    <ArrowRightLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(m.user_id, display)}
                    disabled={pending}
                    aria-label={t('removeAria')}
                  >
                    <UserMinus className="size-4" />
                  </Button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
