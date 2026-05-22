import type { Currency } from '@/lib/schemas/expense';

/**
 * Display labels and chart series identifiers for currencies.
 * Centralised so charts/forms/exports never inline `'ARS'`/`'USD'` strings.
 */
export const CURRENCIES = ['ARS', 'USD'] as const satisfies readonly Currency[];

export const CURRENCY_LABEL: Record<Currency, string> = {
  ARS: 'ARS',
  USD: 'USD',
};

/** Lowercase variants used as chart series keys. */
export const CURRENCY_SERIES = {
  ars: 'ARS',
  usd: 'USD',
} as const satisfies Record<string, Currency>;

export type CurrencySeriesKey = keyof typeof CURRENCY_SERIES;
