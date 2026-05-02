'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DangerActionRow, DangerZone } from '@/components/ui/danger-zone';
import { deleteWorkspace } from '@/actions/workspaces/delete-workspace';
import { leaveWorkspace } from '@/actions/workspaces/leave-workspace';

export function WorkspaceDangerZone({
  id,
  name,
  isOwner,
}: {
  id: string;
  name: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const t = useTranslations('workspaces');
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function onLeave() {
    if (!confirm(t('leaveConfirm'))) return;
    startTransition(async () => {
      const result = await leaveWorkspace({ workspaceId: id });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('leftWorkspace'));
      router.push('/settings/workspaces');
      router.refresh();
    });
  }

  return (
    <DangerZone
      title={t('dangerZoneOwnerTitle')}
      description={
        isOwner
          ? t('dangerZoneOwnerDescription')
          : t('dangerZoneMemberDescription')
      }
    >
      {!isOwner && (
        <DangerActionRow
          title={t('leaveTitle')}
          description={t('leaveDescription')}
          action={
            <Button variant="outline" onClick={onLeave} disabled={pending}>
              <LogOut className="mr-1 size-4" /> {t('leaveButton')}
            </Button>
          }
        />
      )}

      {isOwner && (
        <DangerActionRow
          title={t('deleteTitle')}
          description={t('deleteRowDescription')}
          action={
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-1 size-4" /> {t('deleteTitle')}
            </Button>
          }
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="destructive"
        title={t('deleteTitle')}
        description={t('deleteDialogDescription', { name })}
        confirmText={name}
        confirmHelp={t('typeToConfirm', { name })}
        onConfirm={() => deleteWorkspace({ id, confirmation: name })}
        onSuccess={() => {
          toast.success(tToasts('workspaceDeleted'));
          router.push('/settings/workspaces');
          router.refresh();
        }}
      />
    </DangerZone>
  );
}
