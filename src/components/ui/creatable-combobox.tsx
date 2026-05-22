'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { ActionResult } from '@/actions/_shared';

export type CreatableComboboxOption = {
  value: string;
  label: string;
};

type Props = {
  /** Currently selected value (option.value) or null if none. */
  value: string | null;
  /** Callable to update the selection — null clears it. */
  onChange: (value: string | null) => void;
  /** Available options to pick from. */
  options: ReadonlyArray<CreatableComboboxOption>;

  /** Placeholder text inside the trigger when nothing is selected. */
  placeholder?: ReactNode;
  /** Label shown for the "no selection" item; if undefined, the option is hidden. */
  emptyOptionLabel?: ReactNode;
  /** Placeholder inside the search input. */
  searchPlaceholder?: string;

  /**
   * Called when the user types a value not in `options` and clicks "Create X".
   * If undefined, the create-on-the-fly action is hidden.
   * Should return the new option (or an action error).
   */
  onCreate?: (name: string) => Promise<ActionResult<CreatableComboboxOption>>;

  /** Optional: rendered next to each option (e.g. color swatch). */
  renderOption?: (option: CreatableComboboxOption) => ReactNode;

  /** Disabled state. */
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
};

/**
 * Combobox primitive with optional create-on-the-fly. Used by VendorCombobox
 * and ProjectTypeCombobox.
 */
export function CreatableCombobox({
  value,
  onChange,
  options,
  placeholder,
  emptyOptionLabel,
  searchPlaceholder,
  onCreate,
  renderOption,
  disabled = false,
  className,
  ariaLabel,
}: Props) {
  const tErrors = useTranslations('errors');
  const tCombo = useTranslations('combobox');
  const placeholderText = placeholder ?? tCombo('noSelection');
  const searchPlaceholderText = searchPlaceholder ?? tCombo('searchOrCreate');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pending, startTransition] = useTransition();
  // Optimistic additions stay until parent re-fetches and the new value flows
  // back via `options`. Keeping them separate avoids the props-mirroring useEffect
  // that used to overwrite local state on every render.
  const [createdLocally, setCreatedLocally] = useState<CreatableComboboxOption[]>([]);

  const pool = useMemo(() => {
    if (createdLocally.length === 0) return options;
    const seen = new Set(options.map((o) => o.value));
    return [...options, ...createdLocally.filter((o) => !seen.has(o.value))];
  }, [options, createdLocally]);

  const selected = pool.find((o) => o.value === value);
  const lower = search.trim().toLowerCase();
  const filtered = pool.filter((o) => o.label.toLowerCase().includes(lower));
  const exactMatch = pool.some((o) => o.label.toLowerCase() === lower);

  function handleCreate() {
    if (!onCreate) return;
    const name = search.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await onCreate(name);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      const created = result.data;
      setCreatedLocally((prev) => [...prev, created]);
      onChange(created.value);
      setSearch('');
      setOpen(false);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate">{selected ? selected.label : placeholderText}</span>
          <ChevronDown className="size-4 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholderText}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 && !lower && (
              <CommandEmpty>{tCombo('startTyping')}</CommandEmpty>
            )}
            <CommandGroup>
              {emptyOptionLabel !== undefined && (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">{emptyOptionLabel}</span>
                  {value === null && <Check className="ml-auto size-4" />}
                </CommandItem>
              )}
              {filtered.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {renderOption ? renderOption(opt) : <span>{opt.label}</span>}
                  {value === opt.value && <Check className="ml-auto size-4" />}
                </CommandItem>
              ))}
              {onCreate && lower && !exactMatch && (
                <CommandItem
                  value="__create__"
                  onSelect={handleCreate}
                  className={cn(pending && 'opacity-50')}
                  disabled={pending}
                >
                  <Plus className="mr-2 size-4" />
                  {tCombo('createNamed', { name: search.trim() })}
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
