'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { useServerAction } from '@/hooks/use-server-action';
import type { Category, Expense, Project, Vendor } from '@/types/domain';

type Values = z.input<typeof CreateExpenseSchema>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

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
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);

  const today = todayIso();
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

  const numericAmount = Number(amount);
  const numericFx = Number(fxRateUsed);
  const equivalent =
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    Number.isFinite(numericFx) &&
    numericFx > 0
      ? currency === 'USD'
        ? `≈ ${(numericAmount * numericFx).toLocaleString('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 2,
          })}`
        : `≈ ${(numericAmount / numericFx).toLocaleString('en-US', {
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
      // In add-another mode we stay on the page; otherwise navigate as before.
      navigate: !isEdit && saveAndAddAnother
        ? undefined
        : expense
          ? `/expenses/${expense.id}`
          : '/expenses',
      onSuccess: () => {
        if (!isEdit && saveAndAddAnother) {
          // Reset only the per-expense fields; keep category, project, vendor
          // and date so the user can hammer through multiple receipts fast.
          form.resetField('amount', { defaultValue: 0 });
          form.resetField('description', { defaultValue: '' });
          form.resetField('notes', { defaultValue: '' });
          // Refocus amount for the next entry.
          requestAnimationFrame(() => {
            document.getElementById('amount')?.focus();
          });
        }
      },
    },
  );

  const errors = form.formState.errors;
  const submitLabel =
    submit.pending
      ? tExpenses('savingExpense')
      : isEdit
        ? tExpenses('saveChanges')
        : numericAmount > 0
          ? tExpenses('saveExpenseWithAmount', {
              amount: numericAmount.toLocaleString(
                currency === 'ARS' ? 'es-AR' : 'en-US',
                { style: 'currency', currency, maximumFractionDigits: 2 },
              ),
            })
          : tExpenses('saveExpense');

  const datePill = (label: string, value: string) => {
    const active = paidAt === value;
    return (
      <button
        type="button"
        onClick={() =>
          form.setValue('paidAt', value, { shouldDirty: true, shouldValidate: true })
        }
        className={cn(
          'inline-flex h-9 items-center rounded-full border px-3 text-[13px] [font-weight:500] transition-colors sm:h-8 sm:text-xs',
          active
            ? 'border-foreground/0 bg-foreground text-background'
            : 'border-border bg-card text-foreground hover:bg-muted',
        )}
      >
        {label}
      </button>
    );
  };

  return (
    <form
      onSubmit={form.handleSubmit(submit.run)}
      className="space-y-5 pb-24 sm:pb-0"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <Label htmlFor="amount">{tExpenses('amount')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            inputMode="decimal"
            autoFocus
            aria-invalid={errors.amount ? true : undefined}
            {...form.register('amount', { valueAsNumber: true })}
          />
          {errors.amount?.message && (
            <p className="text-sm text-destructive" role="alert">
              {String(errors.amount.message)}
            </p>
          )}
          {equivalent && (
            <p className="tabular-nums text-xs text-muted-foreground">{equivalent}</p>
          )}
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

      {/* FX rate — always visible. The auto-fill from daily_fx_rates frequently
          lags behind the parallel-market rate the user actually paid, so
          surfacing the override as a first-class field beats hiding it in a
          disclosure. The warning sits next to the input so it can't be missed. */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="fxRateUsed">{tExpenses('fxRateShort')}</Label>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            ARS / USD
          </span>
        </div>
        <Input
          id="fxRateUsed"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          className="tabular-nums"
          aria-invalid={errors.fxRateUsed ? true : undefined}
          {...form.register('fxRateUsed', { valueAsNumber: true })}
        />
        {errors.fxRateUsed?.message && (
          <p className="text-sm text-destructive" role="alert">
            {String(errors.fxRateUsed.message)}
          </p>
        )}
        {fxWarning && (
          <p
            role="status"
            className="inline-flex items-center gap-1.5 rounded-md bg-status-warning px-2 py-1 text-xs text-status-warning-foreground"
          >
            <AlertTriangle className="size-3" aria-hidden />
            {fxWarning}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="paidAt">{tExpenses('date')}</Label>
          <div className="flex flex-wrap items-center gap-2">
            {datePill(tExpenses('datePillToday'), today)}
            {datePill(tExpenses('datePillYesterday'), yesterdayIso())}
            <Input
              id="paidAt"
              type="date"
              required
              className="flex-1 min-w-[140px]"
              aria-invalid={errors.paidAt ? true : undefined}
              {...form.register('paidAt')}
            />
          </div>
          {errors.paidAt?.message && (
            <p className="text-sm text-destructive" role="alert">
              {String(errors.paidAt.message)}
            </p>
          )}
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
          placeholder={tExpenses('descriptionPlaceholderRich')}
          {...form.register('description')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{tExpenses('notes')}</Label>
        <Textarea id="notes" rows={2} {...form.register('notes')} />
      </div>


      {/* Sticky bottom action bar on mobile — keeps submit reachable on long
          forms without forcing a scroll-to-bottom. Falls back to inline on sm+
          since the desktop form fits in a single viewport. */}
      <div
        className={cn(
          'sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur',
          'sm:static sm:mx-0 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0',
        )}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {!isEdit && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground sm:order-1 sm:mr-auto">
            <input
              type="checkbox"
              checked={saveAndAddAnother}
              onChange={(e) => setSaveAndAddAnother(e.target.checked)}
              className="size-4 rounded border-border accent-foreground"
            />
            {tExpenses('saveAndAddAnother')}
          </label>
        )}
        <div className="flex justify-end gap-2 sm:order-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={submit.pending}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
