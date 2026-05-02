import type { Currency } from '@/types/domain';

export const CURRENCIES: Currency[] = ['ARS', 'USD'];

export const CURRENCY_LABEL: Record<Currency, string> = {
  ARS: 'ARS',
  USD: 'USD',
};

export const CURRENCY_LOCALE: Record<Currency, string> = {
  ARS: 'es-AR',
  USD: 'en-US',
};

export const EXPENSE_LIST_DEFAULT_LIMIT = 100;
export const EXPENSE_LIST_DETAIL_LIMIT = 50;
export const EXPENSE_RECENT_LIMIT = 10;
export const EXPENSE_EXPORT_LIMIT = 10_000;

export const EXPENSE_BULK_INSERT_CHUNK = 500;
export const EXCEL_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
export const EXCEL_IMPORT_MAX_ROWS = 5_000;
