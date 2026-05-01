'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  function onArchiveToggle() {
    startTransition(async () => {
      const result = await archiveProject({ id, archive: !archived });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(archived ? 'Proyecto reactivado' : 'Proyecto archivado');
      router.refresh();
    });
  }

  function onDelete() {
    startTransition(async () => {
      const result = await deleteProject({ id, confirmation });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success('Proyecto borrado');
      router.push('/projects');
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/projects/${id}/edit`}>
          <Pencil className="mr-1 size-4" /> Editar
        </Link>
      </Button>
      <Button variant="ghost" size="sm" onClick={onArchiveToggle} disabled={pending}>
        {archived ? (
          <>
            <ArchiveRestore className="mr-1 size-4" /> Reactivar
          </>
        ) : (
          <>
            <Archive className="mr-1 size-4" /> Archivar
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDeleteOpen(true)}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="mr-1 size-4" /> Borrar
      </Button>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteOpen(false);
            setConfirmation('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Borrar proyecto</DialogTitle>
            <DialogDescription>
              Esto va a borrar el proyecto <strong>{name}</strong> y{' '}
              <strong>todos sus gastos</strong> asociados de forma permanente. No se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm">
              Escribí <strong>{name}</strong> para confirmar
            </Label>
            <Input
              id="confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pending || confirmation !== name}
              onClick={onDelete}
            >
              {pending ? '…' : 'Borrar definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
