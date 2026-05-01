'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
import { getRateForDate } from '@/actions/fx/get-rate-for-date';
import { VendorCombobox } from '@/components/domain/vendor-combobox';
import type { Category, Project, Vendor } from '@/types/domain';

type Values = z.input<typeof CreateExpenseSchema>;

export function ExpenseForm({
  workspaceId,
  projects,
  categories,
  vendors,
  defaultProjectId = null,
}: {
  workspaceId: string;
  projects: Pick<Project, 'id' | 'name'>[];
  categories: Pick<Category, 'id' | 'name' | 'color'>[];
  vendors: Pick<Vendor, 'id' | 'name'>[];
  defaultProjectId?: string | null;
}) {
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fxWarning, setFxWarning] = useState<string | null>(null);
  const [vendorOptions, setVendorOptions] = useState(vendors);

  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<Values>({
    resolver: zodResolver(CreateExpenseSchema),
    defaultValues: {
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

  // Auto-fill FX rate when switching to USD or changing date
  useEffect(() => {
    if (currency !== 'USD') {
      form.setValue('fxRateUsed', 1);
      setFxWarning(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const result = await getRateForDate({ date: paidAt, fallbackToLatest: true });
      if (cancelled) return;
      if (!result.ok || !result.data) {
        setFxWarning(
          'No hay cotización oficial para esa fecha — ingresá la tasa manualmente.',
        );
        form.setValue('fxRateUsed', 0);
        return;
      }
      form.setValue('fxRateUsed', result.data.rate, { shouldValidate: true });
      setFxWarning(
        result.data.date === paidAt
          ? null
          : `Usando última tasa disponible (${result.data.date}).`,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [currency, paidAt, form]);

  const equivalent =
    currency === 'USD' && amount && fxRateUsed
      ? `≈ $${(amount * fxRateUsed).toLocaleString('es-AR', { maximumFractionDigits: 2 })} ARS`
      : currency === 'ARS' && amount && fxRateUsed && fxRateUsed > 1
      ? `≈ US$${(amount / fxRateUsed).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
      : null;

  function onSubmit(values: Values) {
    startTransition(async () => {
      const cleaned: Values = {
        ...values,
        description: values.description?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
        vendorId: values.vendorId || null,
      };
      const result = await createExpense(cleaned);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      toast.success('Gasto registrado');
      router.push('/expenses');
      router.refresh();
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
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
          <Label htmlFor="currency">Moneda</Label>
          <Select
            value={currency}
            onValueChange={(v) => form.setValue('currency', v as Currency)}
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

      {currency === 'USD' && (
        <div className="space-y-2">
          <Label htmlFor="fxRateUsed">Tasa de cambio (ARS por USD)</Label>
          <Input
            id="fxRateUsed"
            type="number"
            step="0.000001"
            min="0"
            {...form.register('fxRateUsed', { valueAsNumber: true })}
          />
          {fxWarning && <p className="text-xs text-amber-600">{fxWarning}</p>}
        </div>
      )}

      {equivalent && (
        <p className="text-sm text-muted-foreground">{equivalent}</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="paidAt">Fecha</Label>
          <Input id="paidAt" type="date" {...form.register('paidAt')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoría</Label>
          <Select
            value={form.watch('categoryId')}
            onValueChange={(v) => form.setValue('categoryId', v)}
          >
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Elegir categoría" />
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
          <Label htmlFor="projectId">Proyecto</Label>
          <Select
            value={form.watch('projectId') ?? '__general__'}
            onValueChange={(v) =>
              form.setValue('projectId', v === '__general__' ? null : v)
            }
          >
            <SelectTrigger id="projectId">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__general__">Generales (sin proyecto)</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vendorId">Proveedor (opcional)</Label>
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
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          placeholder="Cemento x 10 bolsas"
          {...form.register('description')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" rows={2} {...form.register('notes')} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar gasto'}
        </Button>
      </div>
    </form>
  );
}
