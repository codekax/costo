'use client';

import {
  parseAsString,
  parseAsStringEnum,
  parseAsIsoDate,
  useQueryStates,
} from 'nuqs';

const dateParser = parseAsIsoDate.withOptions({ clearOnDefault: true });
const currencyParser = parseAsStringEnum(['ARS', 'USD'] as const).withOptions({
  clearOnDefault: true,
});

/**
 * URL-state filters for /expenses (and dashboard).
 * scope is owned by the tabs in expenses-scope-tabs.tsx (separate concern)
 * and is intentionally NOT included here so we can stack with it.
 */
export function useExpenseFilters() {
  return useQueryStates(
    {
      category: parseAsString.withDefault(''),
      vendor: parseAsString.withDefault(''),
      currency: currencyParser, // null when absent
      from: dateParser,
      to: dateParser,
      q: parseAsString.withDefault(''),
    },
    {
      history: 'push',
      shallow: false,
      throttleMs: 250,
      clearOnDefault: true,
    },
  );
}
