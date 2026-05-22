'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createExpense } from '@/actions/expenses/create-expense';
import { getRateForDate } from '@/actions/fx/get-rate-for-date';
import type { Currency } from '@/lib/schemas/expense';

type CategoryOption = { id: string; name: string; color: string };

/**
 * Inline quick-add. Defaults that match the dashboard's daily-flow use case:
 *  - paidAt = today
 *  - currency = ARS
 *  - projectId = null (Generales)
 *  - vendorId = null
 *  - fxRateUsed = looked up server-side via getRateForDate
 *
 * The "Más opciones" link punts to /expenses/new for the full form.
 */
export function QuickAddExpense({
  workspaceId,
  categories,
}: {
  workspaceId: string;
  categories: CategoryOption[];
}) {
  const t = useTranslations('dashboard.quickAdd');
  const tToasts = useTranslations('toasts');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('ARS');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? '');

  if (categories.length === 0) {
    return null;
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error(tErrors('invalid_input'));
      return;
    }
    if (!categoryId) {
      toast.error(tErrors('invalid_input'));
      return;
    }

    startTransition(async () => {
      const today = new Date().toISOString().slice(0, 10);
      const fx = await getRateForDate({ date: today, fallbackToLatest: true });
      if (!fx.ok || !fx.data) {
        toast.error(tErrors('fx_unavailable'));
        return;
      }

      const result = await createExpense({
        workspaceId,
        projectId: null,
        categoryId,
        vendorId: null,
        amount: parsed,
        currency,
        fxRateUsed: fx.data.rate,
        paidAt: today,
      });

      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }

      toast.success(tToasts('expenseCreated'));
      setAmount('');
      router.refresh();
    });
  }

  return (
    <Card>
      <CardContent>
        <form
          onSubmit={submit}
          className="grid gap-3 sm:grid-cols-[1fr_120px_1fr_auto]"
        >
          <div className="space-y-1.5">
            <Label htmlFor="quick-amount" className="text-xs uppercase tracking-wide">
              {t('amount')}
            </Label>
            <Input
              id="quick-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quick-currency" className="text-xs uppercase tracking-wide">
              {t('currency')}
            </Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
              <SelectTrigger id="quick-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ARS">ARS</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quick-category" className="text-xs uppercase tracking-wide">
              {t('category')}
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="quick-category">
                <SelectValue />
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

          {/* Phantom label ghosts the column above the button so all four
              grid columns measure the same height and items-end works
              pixel-perfectly. */}
          <div className="space-y-1.5">
            <span
              aria-hidden
              className="hidden text-xs uppercase tracking-wide opacity-0 sm:block"
            >
              &nbsp;
            </span>
            <Button type="submit" disabled={pending} className="w-full">
              <Plus className="mr-1 size-4" aria-hidden />
              {pending ? t('saving') : t('add')}
            </Button>
          </div>
        </form>

        <div className="mt-3 flex justify-end">
          <Link
            href="/expenses/new"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('moreOptions')}
            <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
