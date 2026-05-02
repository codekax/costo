'use client';

import { Search, X } from 'lucide-react';
import { useQueryState, parseAsString } from 'nuqs';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const QUERY_PARSER = parseAsString.withDefault('').withOptions({
  clearOnDefault: true,
  history: 'push',
  shallow: false,
  // nuqs throttles the URL update — no need for our own useState mirror + useEffect.
  throttleMs: 300,
});

export function SearchInput({ placeholder }: { placeholder?: string }) {
  const t = useTranslations('filters');
  const [query, setQuery] = useQueryState('q', QUERY_PARSER);
  const ph = placeholder ?? t('searchPlaceholder');

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={query}
        onChange={(e) => void setQuery(e.target.value)}
        placeholder={ph}
        className="pl-12 pr-12"
        aria-label={t('searchAria')}
      />
      {query && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={() => void setQuery('')}
          aria-label={t('clearSearch')}
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
