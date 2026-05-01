import type { Currency } from '@/types/domain';

export type FxSnapshotInput = {
  amount: number;
  currency: Currency;
  fxRate: number;
};

export type FxSnapshotResult = {
  amountArs: number;
  amountUsd: number;
};

/**
 * Computes the ARS and USD equivalents for an expense at creation time.
 * The result is denormalized into expenses.amount_ars / amount_usd as an
 * immutable snapshot (constitution principle IV).
 *
 * Throws if inputs are invalid (zero/negative). Callers must validate first
 * with Zod schemas — this is a pure function with no I/O.
 */
export function computeAmounts({ amount, currency, fxRate }: FxSnapshotInput): FxSnapshotResult {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('amount must be > 0');
  if (!Number.isFinite(fxRate) || fxRate <= 0) throw new Error('fxRate must be > 0');

  if (currency === 'ARS') {
    return {
      amountArs: round2(amount),
      amountUsd: round2(amount / fxRate),
    };
  }
  return {
    amountUsd: round2(amount),
    amountArs: round2(amount * fxRate),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
