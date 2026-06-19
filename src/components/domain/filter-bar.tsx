'use client';

import { CalendarRange, Tag, Coins, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useExpenseFilters } from '@/hooks/use-expense-filters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Option = { id: string; name: string; color?: string };

export function FilterBar({ categories }: { categories: Option[] }) {
  const t = useTranslations('filters');
  const [filters, setFilters] = useExpenseFilters();

  const activeCount =
    Number(!!filters.category) +
    Number(!!filters.currency) +
    Number(!!filters.from) +
    Number(!!filters.to);

  const categoryName = filters.category
    ? categories.find((c) => c.id === filters.category)?.name
    : null;

  const fromIso = filters.from ? formatDate(filters.from) : '';
  const toIso = filters.to ? formatDate(filters.to) : '';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={pillClass(Boolean(filters.from || filters.to))}
            aria-label={t('dateRange')}
          >
            <CalendarRange className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {filters.from || filters.to
                ? `${fromIso || '…'} → ${toIso || '…'}`
                : t('dateRange')}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="from">{t('from')}</Label>
            <Input
              id="from"
              type="date"
              value={fromIso}
              onChange={(e) =>
                void setFilters({ from: e.target.value ? new Date(e.target.value) : null })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">{t('to')}</Label>
            <Input
              id="to"
              type="date"
              value={toIso}
              onChange={(e) =>
                void setFilters({ to: e.target.value ? new Date(e.target.value) : null })
              }
            />
          </div>
          {(filters.from || filters.to) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => void setFilters({ from: null, to: null })}
            >
              {t('clearDates')}
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Category */}
      <FilterPill
        active={!!filters.category}
        label={categoryName ?? t('category')}
        icon={<Tag className="size-4" />}
        onClear={() => void setFilters({ category: '' })}
      >
        <Select
          value={filters.category || 'all'}
          onValueChange={(v) => void setFilters({ category: v === 'all' ? '' : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  {c.color && (
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                  )}
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterPill>

      {/* Currency */}
      <FilterPill
        active={!!filters.currency}
        label={filters.currency ?? t('currency')}
        icon={<Coins className="size-4" />}
        onClear={() => void setFilters({ currency: null })}
      >
        <Select
          value={filters.currency ?? 'all'}
          onValueChange={(v) =>
            void setFilters({ currency: v === 'all' ? null : (v as 'ARS' | 'USD') })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="ARS">ARS</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </FilterPill>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() =>
            void setFilters({
              category: '',
              vendor: '',
              currency: null,
              from: null,
              to: null,
            })
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] [font-weight:510] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-8 sm:text-xs"
        >
          {t('clearAll')}
          <Badge variant="secondary" className="px-1.5">
            {activeCount}
          </Badge>
        </button>
      )}
    </div>
  );
}

/**
 * Shared pill style for trigger + clear-all buttons (Linear toolbar chip):
 * hairline border at rest, a subtle indigo tint when a value is applied.
 * Slightly taller on mobile (36px touch target) than desktop (32px).
 */
function pillClass(active: boolean): string {
  return [
    'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] [font-weight:510] transition-colors',
    'sm:h-8 sm:text-xs',
    active
      ? 'border-primary/40 bg-primary/[0.08] text-foreground'
      : 'border-border bg-card text-foreground hover:bg-muted',
  ].join(' ');
}

function FilterPill({
  active,
  label,
  icon,
  onClear,
  children,
}: {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClear: () => void;
  children: React.ReactNode;
}) {
  const t = useTranslations('filters');
  return (
    <div className="inline-flex items-center">
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={pillClass(active)} aria-label={label}>
            <span className="contents [&_svg]:size-4 [&_svg]:shrink-0">{icon}</span>
            <span className="truncate">{label}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          {children}
        </PopoverContent>
      </Popover>
      {active && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t('clearLabel', { label })}
          className="ml-1 inline-flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
