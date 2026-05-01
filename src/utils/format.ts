import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import type { Currency } from '@/types/domain';

const localeMap = { es, en: enUS } as const;

export function formatCurrency(
  amount: number,
  currency: Currency,
  locale: 'es' | 'en' = 'es',
): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: string | Date, locale: 'es' | 'en' = 'es'): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'dd MMM yyyy', { locale: localeMap[locale] });
}

export function formatDateInput(value: string | Date): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'yyyy-MM-dd');
}
