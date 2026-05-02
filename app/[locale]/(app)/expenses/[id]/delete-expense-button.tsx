'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { deleteExpense } from '@/actions/expenses/delete-expense';

export function DeleteExpenseButton({ id }: { id: string }) {
  const router = useRouter();
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const tExpenses = useTranslations('expenses');
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(tExpenses('confirmDelete'))) return;
    startTransition(async () => {
      const result = await deleteExpense({ id });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success(tToasts('expenseDeleted'));
      router.push('/expenses');
      router.refresh();
    });
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={onClick}
      disabled={pending}
      aria-label={tExpenses('deleteAria')}
    >
      <Trash2 className="mr-1 size-4" /> {tExpenses('delete')}
    </Button>
  );
}
