'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteExpense } from '@/actions/expenses/delete-expense';

export function ExpenseRowActions({ id }: { id: string }) {
  const router = useRouter();
  const t = useTranslations('expenses');
  const tToasts = useTranslations('toasts');
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('rowActionsAria')}
            // Stop the row's overlay <Link> from intercepting the click
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => router.push(`/expenses/${id}/edit`)}>
            <Pencil className="mr-2 size-4" /> {t('editExpense')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}>
            <Trash2 className="mr-2 size-4" /> {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="destructive"
        title={t('delete')}
        description={t('confirmDelete')}
        confirmLabel={t('delete')}
        onConfirm={() => deleteExpense({ id })}
        onSuccess={() => {
          // toast handled here so the success message uses the i18n key
          router.refresh();
        }}
      />
    </>
  );
}
