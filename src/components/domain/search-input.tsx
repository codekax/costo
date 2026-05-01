'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useQueryState, parseAsString } from 'nuqs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const QUERY_PARSER = parseAsString.withDefault('').withOptions({
  clearOnDefault: true,
  history: 'push',
  shallow: false,
});

const DEBOUNCE_MS = 300;

export function SearchInput({ placeholder = 'Buscar gastos…' }: { placeholder?: string }) {
  const [serverQuery, setServerQuery] = useQueryState('q', QUERY_PARSER);
  const [localQuery, setLocalQuery] = useState(serverQuery);

  useEffect(() => {
    setLocalQuery(serverQuery);
  }, [serverQuery]);

  useEffect(() => {
    if (localQuery === serverQuery) return;
    const id = setTimeout(() => {
      void setServerQuery(localQuery || '');
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [localQuery, serverQuery, setServerQuery]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
        aria-label="Buscar gastos"
      />
      {localQuery && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          onClick={() => {
            setLocalQuery('');
            void setServerQuery('');
          }}
          aria-label="Limpiar búsqueda"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
