'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VendorForm } from '@/components/forms/vendor-form';
import { deleteVendor } from '@/actions/vendors/delete-vendor';
import type { Vendor } from '@/types/domain';

export function VendorsList({
  workspaceId,
  vendors,
}: {
  workspaceId: string;
  vendors: Vendor[];
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [deleting, setDeleting] = useState<Vendor | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [pending, startTransition] = useTransition();
  const tErrors = useTranslations('errors');

  function refresh() {
    router.refresh();
  }

  function onDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteVendor({ id: deleting.id, confirmation });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success('Proveedor borrado');
      setDeleting(null);
      setConfirmation('');
      refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 size-4" /> Nuevo proveedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo proveedor</DialogTitle>
            </DialogHeader>
            <VendorForm
              workspaceId={workspaceId}
              onDone={() => {
                setCreateOpen(false);
                refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {vendors.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Sin proveedores. Creá el primero o agregalos al cargar un gasto.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {vendors.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 p-3 hover:bg-accent/30">
              <div>
                <p className="font-medium">{v.name}</p>
                {v.contact && <p className="text-xs text-muted-foreground">{v.contact}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(v)}
                  aria-label={`Editar ${v.name}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleting(v)}
                  aria-label={`Borrar ${v.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar proveedor</DialogTitle>
          </DialogHeader>
          {editing && (
            <VendorForm
              workspaceId={workspaceId}
              vendor={editing}
              onDone={() => {
                setEditing(null);
                refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) {
            setDeleting(null);
            setConfirmation('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Borrar proveedor</DialogTitle>
            <DialogDescription>
              Esto borra <strong>{deleting?.name}</strong>. Los gastos asociados quedan sin
              proveedor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm">
              Escribí <strong>{deleting?.name}</strong> para confirmar
            </Label>
            <Input
              id="confirm"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleting(null);
                setConfirmation('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pending || confirmation !== deleting?.name}
              onClick={onDelete}
            >
              {pending ? '…' : 'Borrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
