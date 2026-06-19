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
import { ListEmpty } from '@/components/ui/list-empty';
import { DataTable } from '@/components/ui/data-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  const tToasts = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const tConfirm = useTranslations('confirm');
  const t = useTranslations('categories');

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
      toast.success(tToasts('categoryDeleted'));
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
              <Plus className="mr-1 size-4" /> {t('newCategory')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('newCategory')}</DialogTitle>
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
        <ListEmpty>{t('empty')}</ListEmpty>
      ) : (
        <DataTable>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon('name')}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => {
                const Icon = getCategoryIcon(c.icon);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        {/* Category identity — color swatch + icon */}
                        <span
                          className="flex size-7 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${c.color}1a`, color: c.color }}
                          aria-hidden
                        >
                          <Icon className="size-4" strokeWidth={1.75} />
                        </span>
                        <span className="[font-weight:510] text-foreground">{c.name}</span>
                      </span>
                    </TableCell>
                    <TableCell className="w-12">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(c)}
                          aria-label={t('editAria', { name: c.name })}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleting(c)}
                          aria-label={t('deleteAria', { name: c.name })}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTable>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editCategory')}</DialogTitle>
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
              {pending ? '…' : tConfirm('deleteForever')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
