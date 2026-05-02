'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { archiveProject } from '@/actions/projects/archive-project';
import { deleteProject } from '@/actions/projects/delete-project';

export function ProjectActions({
  id,
  name,
  archived,
}: {
  id: string;
  name: string;
  archived: boolean;
}) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const t = useTranslations('projects');
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  function onArchiveToggle() {
    startTransition(async () => {
      const result = await archiveProject({ id, archive: !archived });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(archived ? tToasts('projectReactivated') : tToasts('projectArchived'));
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/projects/${id}/edit`}>
          <Pencil className="mr-1 size-4" /> {t('edit')}
        </Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={onArchiveToggle} disabled={pending}>
        {archived ? (
          <>
            <ArchiveRestore className="mr-1 size-4" /> {t('reactivate')}
          </>
        ) : (
          <>
            <Archive className="mr-1 size-4" /> {t('archive')}
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDeleteOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="mr-1 size-4" /> {t('delete')}
      </Button>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="destructive"
        title={t('deleteTitle')}
        description={t('deleteDescription', { name })}
        confirmText={name}
        confirmHelp={t('typeToConfirm', { name })}
        onConfirm={() => deleteProject({ id, confirmation: name })}
        onSuccess={() => {
          toast.success(tToasts('projectDeleted'));
          router.push('/projects');
          router.refresh();
        }}
      />
    </div>
  );
}
