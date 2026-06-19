'use client';

import { useTransition } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { exportCsv } from '@/actions/import-export/export-csv';
import { parseExpenseFiltersFromSearchParams } from '@/lib/expense-filters';
import { cn } from '@/lib/utils';

export function ExportCsvButton({
  workspaceId,
  className,
}: {
  workspaceId: string;
  className?: string;
}) {
  const tErrors = useTranslations('errors');
  const tToasts = useTranslations('toasts');
  const tExpenses = useTranslations('expenses');
  const [pending, startTransition] = useTransition();
  const sp = useSearchParams();

  function onClick() {
    startTransition(async () => {
      const { filters } = parseExpenseFiltersFromSearchParams(sp);
      const result = await exportCsv({ workspaceId, filters });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      const blob = new Blob(['﻿' + result.data.csv], {
        type: 'text/csv;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(tToasts('csvDownloaded'));
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className={cn('shrink-0', className)}
    >
      <Download className="mr-1 size-4" />
      {pending ? tExpenses('exporting') : tExpenses('exportCsv')}
    </Button>
  );
}
