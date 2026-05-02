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
  const tToasts = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const t = useTranslations('vendors');

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
      toast.success(tToasts('vendorDeleted'));
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
              <Plus className="mr-1 size-4" /> {t('newVendor')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('newVendor')}</DialogTitle>
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
          {t('empty')}
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {vendors.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 p-3 hover:bg-foreground/5">
              <div>
                <p className="font-medium">{v.name}</p>
                {v.contact && <p className="text-xs text-muted-foreground">{v.contact}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(v)}
                  aria-label={t('editAria', { name: v.name })}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleting(v)}
                  aria-label={t('deleteAria', { name: v.name })}
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
            <DialogTitle>{t('editVendor')}</DialogTitle>
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
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDescription', { name: deleting?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm">
              {t('typeToConfirm', { name: deleting?.name ?? '' })}
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
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={pending || confirmation !== deleting?.name}
              onClick={onDelete}
            >
              {pending ? '…' : tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
