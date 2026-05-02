/**
 * Single source of truth for parsing URL search params into `ExpenseFilters`.
 *
 * Used by:
 *  - /expenses page (server, async searchParams)
 *  - <ExportCsvButton> (client, useSearchParams)
 *  - useExpenseFilters hook (client, nuqs)
 *
 * Adding a new filter param means editing this file ONLY.
 */

import type { ReadonlyURLSearchParams } from 'next/navigation';
import type { ExpenseFilters } from '@/lib/schemas/expense';
import { parseScope, scopeToProjectFilter, type Scope } from '@/lib/scope';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** All URL params that this module knows about. */
export type ExpenseFilterParams = {
  scope?: string | null;
  category?: string | null;
  vendor?: string | null;
  currency?: string | null;
  from?: string | null;
  to?: string | null;
  q?: string | null;
};

function pickUuid(value: string | null | undefined): string | undefined {
  return value && UUID_RE.test(value) ? value : undefined;
}

function pickDate(value: string | null | undefined): string | undefined {
  return value && DATE_RE.test(value) ? value : undefined;
}

function pickCurrency(value: string | null | undefined): 'ARS' | 'USD' | undefined {
  return value === 'ARS' || value === 'USD' ? value : undefined;
}

function pickSearch(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 200 ? trimmed : undefined;
}

/**
 * Parse a record-shaped params object (e.g. Next page `searchParams`) into
 * a typed `ExpenseFilters` plus the `Scope` it implies.
 */
export function parseExpenseFiltersFromObject(input: ExpenseFilterParams): {
  scope: Scope;
  filters: ExpenseFilters;
  hasFilters: boolean;
} {
  const scope = parseScope(input.scope);
  const category = pickUuid(input.category);
  const vendor = pickUuid(input.vendor);
  const currency = pickCurrency(input.currency);
  const dateFrom = pickDate(input.from);
  const dateTo = pickDate(input.to);
  const search = pickSearch(input.q);

  const filters: ExpenseFilters = {
    ...scopeToProjectFilter(scope),
    ...(category ? { categoryId: category } : {}),
    ...(vendor ? { vendorId: vendor } : {}),
    ...(currency ? { currency } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
    ...(search ? { search } : {}),
  };

  const hasFilters = Boolean(category || vendor || currency || dateFrom || dateTo || search);

  return { scope, filters, hasFilters };
}

/**
 * Same as above but for client-side `useSearchParams()` results.
 */
export function parseExpenseFiltersFromSearchParams(
  sp: URLSearchParams | ReadonlyURLSearchParams,
): {
  scope: Scope;
  filters: ExpenseFilters;
  hasFilters: boolean;
} {
  return parseExpenseFiltersFromObject({
    scope: sp.get('scope'),
    category: sp.get('category'),
    vendor: sp.get('vendor'),
    currency: sp.get('currency'),
    from: sp.get('from'),
    to: sp.get('to'),
    q: sp.get('q'),
  });
}
