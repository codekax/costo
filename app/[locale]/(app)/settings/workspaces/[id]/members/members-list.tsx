'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, ArrowRightLeft, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    <DataTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('colMember')}</TableHead>
            <TableHead>{t('colRole')}</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const display = m.display_name ?? m.email ?? t('fallbackMember');
            const initial = (display.charAt(0) || 'M').toUpperCase();
            return (
              <TableRow key={m.user_id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate [font-weight:510] text-foreground">{display}</p>
                      {m.email && m.email !== display && (
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={m.role === 'owner' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {m.role === 'owner' && <Crown className="mr-1 size-3" />}
                    {m.role}
                  </Badge>
                </TableCell>
                <TableCell className="w-16">
                  {canManage && m.role !== 'owner' ? (
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onTransfer(m.user_id, display)}
                        disabled={pending}
                        aria-label={t('transferAria')}
                        title={t('transferAria')}
                      >
                        <ArrowRightLeft className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onRemove(m.user_id, display)}
                        disabled={pending}
                        aria-label={t('removeAria')}
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DataTable>
  );
}
