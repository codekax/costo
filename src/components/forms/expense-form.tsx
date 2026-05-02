'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateExpenseSchema, type Currency } from '@/lib/schemas/expense';
import { createExpense } from '@/actions/expenses/create-expense';
import { updateExpense } from '@/actions/expenses/update-expense';
import { getRateForDate } from '@/actions/fx/get-rate-for-date';
import { VendorCombobox } from '@/components/domain/vendor-combobox';
import { useServerAction } from '@/hooks/use-server-action';
import type { Category, Expense, Project, Vendor } from '@/types/domain';

type Values = z.input<typeof CreateExpenseSchema>;

export function ExpenseForm({
  workspaceId,
  projects,
  categories,
  vendors,
  defaultProjectId = null,
  expense,
}: {
  workspaceId: string;
  projects: Pick<Project, 'id' | 'name'>[];
  categories: Pick<Category, 'id' | 'name' | 'color'>[];
  vendors: Pick<Vendor, 'id' | 'name'>[];
  defaultProjectId?: string | null;
  /** When provided, the form is in edit mode and will call updateExpense. */
  expense?: Expense;
}) {
  const t = useTranslations('toasts');
  const tCommon = useTranslations('common');
  const tExpenses = useTranslations('expenses');
  const router = useRouter();
  const [fxWarning, setFxWarning] = useState<string | null>(null);
  const [vendorOptions, setVendorOptions] = useState(vendors);

  const today = new Date().toISOString().slice(0, 10);
  const isEdit = Boolean(expense);

  const form = useForm<Values>({
    resolver: zodResolver(CreateExpenseSchema),
    defaultValues: expense
      ? {
          workspaceId: expense.workspace_id,
          projectId: expense.project_id,
          categoryId: expense.category_id,
          currency: expense.currency,
          fxRateUsed: Number(expense.fx_rate_used),
          amount: Number(expense.amount),
          paidAt: expense.paid_at,
          description: expense.description ?? '',
          notes: expense.notes ?? '',
          vendorId: expense.vendor_id,
        }
      : {
          workspaceId,
          projectId: defaultProjectId,
          categoryId: categories[0]?.id ?? '',
          currency: 'ARS',
          fxRateUsed: 1,
          amount: 0,
          paidAt: today,
          description: '',
          notes: '',
          vendorId: null,
        },
  });

  const currency = form.watch('currency') as Currency;
  const amount = form.watch('amount');
  const fxRateUsed = form.watch('fxRateUsed');
  const paidAt = form.watch('paidAt');

  // Auto-fill FX rate from daily_fx_rates regardless of currency.
  // Both directions need a real rate: USD → ARS conversion AND ARS → USD conversion.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getRateForDate({ date: paidAt, fallbackToLatest: true });
      if (cancelled) return;
      if (!result.ok || !result.data) {
        setFxWarning(tExpenses('fxUnavailable'));
        form.setValue('fxRateUsed', 0);
        return;
      }
      form.setValue('fxRateUsed', result.data.rate, { shouldValidate: true });
      setFxWarning(
        result.data.date === paidAt
          ? null
          : tExpenses('fxUsingLatest', { date: result.data.date }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [paidAt, form]);

  const equivalent =
    amount && fxRateUsed && fxRateUsed > 0
      ? currency === 'USD'
        ? `≈ ${(amount * fxRateUsed).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 2,
          })}`
        : `≈ ${(amount / fxRateUsed).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 2,
          })}`
      : null;

  const submit = useServerAction<Values, unknown>(
    (values) => {
      const cleaned: Values = {
        ...values,
        description: values.description?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        vendorId: values.vendorId || null,
      };
      return expense
        ? updateExpense({ ...cleaned, id: expense.id, etag: expense.updated_at })
        : createExpense(cleaned);
    },
    {
      successMessage: t(isEdit ? 'expenseUpdated' : 'expenseCreated'),
      navigate: expense ? `/expenses/${expense.id}` : '/expenses',
    },
  );

  return (
    <form onSubmit={form.handleSubmit(submit.run)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <Label htmlFor="amount">{tExpenses('amount')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            autoFocus
            {...form.register('amount', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">{tExpenses('currency')}</Label>
          <Select
            value={currency}
            onValueChange={(v) =>
              form.setValue('currency', v as Currency, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fxRateUsed">{tExpenses('fxRate')}</Label>
        <Input
          id="fxRateUsed"
          type="number"
          step="0.000001"
          min="0"
          {...form.register('fxRateUsed', { valueAsNumber: true })}
        />
        {fxWarning && <p className="text-xs text-amber-600">{fxWarning}</p>}
        {equivalent && <p className="text-sm text-muted-foreground">{equivalent}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="paidAt">{tExpenses('date')}</Label>
          <Input id="paidAt" type="date" {...form.register('paidAt')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">{tExpenses('category')}</Label>
          <Select
            value={form.watch('categoryId')}
            onValueChange={(v) =>
              form.setValue('categoryId', v, { shouldDirty: true, shouldValidate: true })
            }
          >
            <SelectTrigger id="categoryId">
              <SelectValue placeholder={tExpenses('categoryPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                      aria-hidden
                    />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="projectId">{tExpenses('project')}</Label>
          <Select
            value={form.watch('projectId') ?? '__general__'}
            onValueChange={(v) =>
              form.setValue('projectId', v === '__general__' ? null : v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="projectId">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__general__">{tExpenses('generalNoProject')}</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendorId">{tExpenses('vendorOptional')}</Label>
          <VendorCombobox
            workspaceId={workspaceId}
            value={form.watch('vendorId') ?? null}
            options={vendorOptions}
            onChange={(id) => form.setValue('vendorId', id)}
            onCreated={(v) => setVendorOptions((prev) => [...prev, v])}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{tExpenses('description')}</Label>
        <Input
          id="description"
          placeholder={tExpenses('descriptionPlaceholder')}
          {...form.register('description')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{tExpenses('notes')}</Label>
        <Textarea id="notes" rows={2} {...form.register('notes')} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={submit.pending}>
          {submit.pending
            ? tExpenses('savingExpense')
            : isEdit
              ? tExpenses('saveChanges')
              : tExpenses('saveExpense')}
        </Button>
      </div>
    </form>
  );
}
