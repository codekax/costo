'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { revokeInvitation } from '@/actions/invitations/revoke-invitation';
import type { PendingInvitation } from '@/lib/db/queries/members';

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400_000));
}

export function PendingInvitationsList({
  invitations,
  canManage,
}: {
  invitations: PendingInvitation[];
  canManage: boolean;
}) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const t = useTranslations('workspaces');
  const [pending, startTransition] = useTransition();

  function onRevoke(id: string, email: string) {
    if (!confirm(t('revokeConfirm', { email }))) return;
    startTransition(async () => {
      const result = await revokeInvitation({ invitationId: id });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('invitationRevoked'));
      router.refresh();
    });
  }

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('colEmail')}</TableHead>
            <TableHead>{t('colExpires')}</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((inv) => {
            const days = daysUntil(inv.expires_at);
            const isExpired = days === 0;
            return (
              <TableRow key={inv.id}>
                <TableCell className="[font-weight:510] text-foreground">{inv.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Clock className="size-3" />
                    {isExpired ? t('expired') : t('expiresIn', { count: days })}
                  </span>
                </TableCell>
                <TableCell className="w-16">
                  {canManage ? (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRevoke(inv.id, inv.email)}
                        disabled={pending}
                      >
                        <X className="mr-1 size-4" /> {t('revoke')}
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
