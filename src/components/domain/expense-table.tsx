import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { DataTable } from '@/components/ui/data-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExpenseRowActions } from '@/components/domain/expense-row-actions';
import type { ExpenseWithRelations } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/format';

/**
 * Expense list as a Linear data table (Fecha · Descripción · Categoría ·
 * Proyecto · Monto). The whole row links to the detail via an overlay; the
 * trailing actions cell sits above it. The compact `ExpenseRow` card is kept
 * for previews (dashboard "recent", project detail) — this is the full list.
 */
export function ExpenseTable({ expenses }: { expenses: ExpenseWithRelations[] }) {
  const t = useTranslations('expenses');

  return (
    <DataTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[104px]">{t('colDate')}</TableHead>
            <TableHead>{t('colDescription')}</TableHead>
            <TableHead>{t('colCategory')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('colProject')}</TableHead>
            <TableHead className="text-right">{t('colAmount')}</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((e) => (
            <TableRow key={e.id} className="group relative cursor-pointer">
              <TableCell className="w-[104px] whitespace-nowrap text-muted-foreground">
                <Link
                  href={`/expenses/${e.id}`}
                  className="absolute inset-0"
                  aria-label={e.description || e.category.name}
                />
                {formatDate(e.paid_at)}
              </TableCell>
              <TableCell className="max-w-[260px] [font-weight:510] text-foreground">
                <span className="block truncate group-hover:underline">
                  {e.description || e.category.name}
                </span>
              </TableCell>
              <TableCell>
                <span className="inline-flex max-w-[160px] items-center gap-2 whitespace-nowrap">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: e.category.color }}
                    aria-hidden
                  />
                  <span className="truncate text-muted-foreground">{e.category.name}</span>
                </span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {e.project ? e.project.name : t('rowProjectGeneral')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end leading-tight">
                  <span className="tabular-nums [font-weight:590] text-foreground">
                    {formatCurrency(Number(e.amount), e.currency)}
                  </span>
                  <span className="tabular-nums text-[12px] text-muted-foreground">
                    ≈{' '}
                    {e.currency === 'USD'
                      ? formatCurrency(Number(e.amount_ars), 'ARS')
                      : formatCurrency(Number(e.amount_usd), 'USD')}
                  </span>
                </div>
              </TableCell>
              <TableCell className="w-10">
                <div className="relative z-10 flex justify-end">
                  <ExpenseRowActions id={e.id} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTable>
  );
}
