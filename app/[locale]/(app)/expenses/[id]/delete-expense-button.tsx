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
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm('¿Borrar este gasto? Esta acción no se puede deshacer.')) return;
    startTransition(async () => {
      const result = await deleteExpense({ id });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success('Gasto borrado');
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
      aria-label="Borrar gasto"
    >
      <Trash2 className="mr-1 size-4" /> Borrar
    </Button>
  );
}
