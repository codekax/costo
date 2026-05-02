/**
 * Expense lifecycle service — owns the rules around creating an Expense:
 *  1. Resolve the FX rate (explicit hint > daily_fx_rates lookup > error).
 *  2. Compute the immutable amount snapshot (amount_ars, amount_usd, fx_rate_used).
 *  3. Persist with the provided supabase client.
 *
 * Both `createExpense` (Server Action) and `importRows` (bulk Excel) call into
 * this. The DB trigger remains as a final safety net — it's not the source of
 * truth here.
 */

import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';
import { computeAmounts } from '@/services/fx/snapshot-fx';
import { getFxRateForDate } from '@/lib/db/queries/daily-fx-rates';
import type { Currency } from '@/types/domain';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export type CreateExpenseRecordInput = {
  workspaceId: string;
  projectId: string | null;
  categoryId: string;
  vendorId?: string | null;
  amount: number;
  currency: Currency;
  /** When provided, takes precedence over daily_fx_rates lookup (user override). */
  fxRateHint?: number | undefined;
  paidAt: string; // YYYY-MM-DD
  description?: string | undefined;
  notes?: string | undefined;
  attachmentUrl?: string | undefined;
  attachmentType?: 'image' | 'pdf' | undefined;
  recurringId?: string | null;
  createdBy: string;
};

export type CreateExpenseRecordResult =
  | { ok: true; expenseId: string; fxRateUsed: number }
  | { ok: false; reason: 'fx_unavailable' | 'persistence_failed' };

/**
 * Resolve FX rate for a given date + currency:
 *  - ARS: hint || lookup-of-day || lookup-latest || 1 (no conversion needed for ARS-primary)
 *  - USD: hint || lookup-of-day || lookup-latest → if all fail, fx_unavailable
 *
 * For ARS rows we permit fx=1 fallback because it doesn't corrupt the snapshot
 * (amount_ars = amount, amount_usd = amount/1 — semantically "no usd equivalent").
 * For USD rows, no fallback: a USD row without a rate has no defined ARS value.
 */
async function resolveFxRate(
  supabase: Db,
  currency: Currency,
  date: string,
  hint: number | undefined,
): Promise<number | null> {
  if (hint && hint > 0) return hint;

  const ofDate = await getFxRateForDate(supabase, date);
  if (ofDate.available) return ofDate.rate;

  if (currency === 'ARS') return 1;
  return null;
}

export async function createExpenseRecord(
  supabase: Db,
  input: CreateExpenseRecordInput,
): Promise<CreateExpenseRecordResult> {
  const fxRate = await resolveFxRate(supabase, input.currency, input.paidAt, input.fxRateHint);
  if (!fxRate) return { ok: false, reason: 'fx_unavailable' };

  const { amountArs, amountUsd } = computeAmounts({
    amount: input.amount,
    currency: input.currency,
    fxRate,
  });

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      workspace_id: input.workspaceId,
      project_id: input.projectId,
      category_id: input.categoryId,
      vendor_id: input.vendorId ?? null,
      amount: input.amount,
      currency: input.currency,
      fx_rate_used: fxRate,
      amount_ars: amountArs,
      amount_usd: amountUsd,
      description: input.description ?? null,
      notes: input.notes ?? null,
      paid_at: input.paidAt,
      attachment_url: input.attachmentUrl ?? null,
      attachment_type: input.attachmentType ?? null,
      recurring_id: input.recurringId ?? null,
      created_by: input.createdBy,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, reason: 'persistence_failed' };
  return { ok: true, expenseId: data.id, fxRateUsed: fxRate };
}

/**
 * Bulk variant — used by Excel import. Resolves FX per-date with caching to
 * avoid N+1 queries when many rows share the same paid_at.
 */
export type BulkExpenseInput = Omit<CreateExpenseRecordInput, 'createdBy'>;

export type BulkExpenseRow = {
  rowNumber: number;
  expense: BulkExpenseInput;
};

export type BulkExpenseResult = {
  imported: number;
  errors: Array<{ rowNumber: number; reason: 'fx_unavailable' | 'persistence_failed' }>;
};

export async function createExpenseRecordsBulk(
  supabase: Db,
  rows: BulkExpenseRow[],
  createdBy: string,
  chunkSize = 500,
): Promise<BulkExpenseResult> {
  const fxCache = new Map<string, number | null>();
  async function fxFor(date: string, currency: Currency, hint: number | undefined) {
    const cacheKey = `${currency}:${date}`;
    if (!fxCache.has(cacheKey)) {
      fxCache.set(cacheKey, await resolveFxRate(supabase, currency, date, hint));
    }
    return hint && hint > 0 ? hint : (fxCache.get(cacheKey) ?? null);
  }

  const inserts: Array<Record<string, unknown>> = [];
  const errors: BulkExpenseResult['errors'] = [];

  for (const { rowNumber, expense } of rows) {
    const fx = await fxFor(expense.paidAt, expense.currency, expense.fxRateHint);
    if (!fx) {
      errors.push({ rowNumber, reason: 'fx_unavailable' });
      continue;
    }
    const { amountArs, amountUsd } = computeAmounts({
      amount: expense.amount,
      currency: expense.currency,
      fxRate: fx,
    });
    inserts.push({
      workspace_id: expense.workspaceId,
      project_id: expense.projectId,
      category_id: expense.categoryId,
      vendor_id: expense.vendorId ?? null,
      amount: expense.amount,
      currency: expense.currency,
      fx_rate_used: fx,
      amount_ars: amountArs,
      amount_usd: amountUsd,
      description: expense.description ?? null,
      notes: expense.notes ?? null,
      paid_at: expense.paidAt,
      created_by: createdBy,
    });
  }

  let imported = 0;
  for (let i = 0; i < inserts.length; i += chunkSize) {
    const chunk = inserts.slice(i, i + chunkSize);
    const { error, count } = await supabase
      .from('expenses')
      .insert(chunk, { count: 'exact' });
    if (error) {
      for (const _ of chunk) errors.push({ rowNumber: -1, reason: 'persistence_failed' });
    } else {
      imported += count ?? chunk.length;
    }
  }

  return { imported, errors };
}
