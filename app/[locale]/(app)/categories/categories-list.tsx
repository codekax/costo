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
import { CategoryForm } from '@/components/forms/category-form';
import { deleteCategory } from '@/actions/categories/delete-category';
import { getCategoryIcon } from '@/lib/category-icons';
import type { Category } from '@/types/domain';

export function CategoriesList({
  workspaceId,
  categories,
}: {
  workspaceId: string;
  categories: Category[];
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [pending, startTransition] = useTransition();
  const tErrors = useTranslations('errors');

  function refresh() {
    router.refresh();
  }

  function onDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteCategory({ id: deleting.id, confirmation });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success('Categoría borrada');
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
              <Plus className="mr-1 size-4" /> Nueva categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
            </DialogHeader>
            <CategoryForm
              workspaceId={workspaceId}
              onDone={() => {
                setCreateOpen(false);
                refresh();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Sin categorías. Creá la primera.
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.icon);
            return (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 p-3 hover:bg-accent/30"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-8 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${c.color}20`, color: c.color }}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(c)}
                    aria-label={`Editar ${c.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(c)}
                    aria-label={`Borrar ${c.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          {editing && (
            <CategoryForm
              workspaceId={workspaceId}
              category={editing}
              onDone={() => {
                setEditing(null);
                refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
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
            <DialogTitle>Borrar categoría</DialogTitle>
            <DialogDescription>
              Esto va a borrar la categoría <strong>{deleting?.name}</strong> y todos sus gastos
              asociados. Esta acción no se puede deshacer.
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
              {pending ? '…' : 'Borrar definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
