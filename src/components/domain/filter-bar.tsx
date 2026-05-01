'use client';

import { CalendarRange, Tag, Users, Coins, X } from 'lucide-react';
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

export function FilterBar({
  categories,
  vendors,
}: {
  categories: Option[];
  vendors: Option[];
}) {
  const [filters, setFilters] = useExpenseFilters();

  const activeCount =
    Number(!!filters.category) +
    Number(!!filters.vendor) +
    Number(!!filters.currency) +
    Number(!!filters.from) +
    Number(!!filters.to);

  const categoryName = filters.category
    ? categories.find((c) => c.id === filters.category)?.name
    : null;
  const vendorName = filters.vendor
    ? vendors.find((v) => v.id === filters.vendor)?.name
    : null;

  const fromIso = filters.from ? formatDate(filters.from) : '';
  const toIso = filters.to ? formatDate(filters.to) : '';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date range */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={filters.from || filters.to ? 'default' : 'outline'} size="sm">
            <CalendarRange className="mr-1 size-4" />
            {filters.from || filters.to
              ? `${fromIso || '…'} → ${toIso || '…'}`
              : 'Rango de fechas'}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="from">Desde</Label>
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
            <Label htmlFor="to">Hasta</Label>
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
              Limpiar fechas
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {/* Category */}
      <FilterPill
        active={!!filters.category}
        label={categoryName ?? 'Categoría'}
        icon={<Tag className="mr-1 size-4" />}
        onClear={() => void setFilters({ category: '' })}
      >
        <Select
          value={filters.category || 'all'}
          onValueChange={(v) => void setFilters({ category: v === 'all' ? '' : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
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

      {/* Vendor */}
      <FilterPill
        active={!!filters.vendor}
        label={vendorName ?? 'Proveedor'}
        icon={<Users className="mr-1 size-4" />}
        onClear={() => void setFilters({ vendor: '' })}
      >
        <Select
          value={filters.vendor || 'all'}
          onValueChange={(v) => void setFilters({ vendor: v === 'all' ? '' : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterPill>

      {/* Currency */}
      <FilterPill
        active={!!filters.currency}
        label={filters.currency ?? 'Moneda'}
        icon={<Coins className="mr-1 size-4" />}
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
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="ARS">ARS</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
      </FilterPill>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            void setFilters({
              category: '',
              vendor: '',
              currency: null,
              from: null,
              to: null,
            })
          }
        >
          Limpiar todo
          <Badge variant="secondary" className="ml-2 px-1.5">
            {activeCount}
          </Badge>
        </Button>
      )}
    </div>
  );
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
  return (
    <div className="inline-flex items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={active ? 'default' : 'outline'} size="sm">
            {icon}
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          {children}
        </PopoverContent>
      </Popover>
      {active && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-1 size-7"
          onClick={onClear}
          aria-label={`Limpiar ${label}`}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
