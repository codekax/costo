'use client';

import { useState, useTransition } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
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
import { createVendor } from '@/actions/vendors/create-vendor';
import { cn } from '@/lib/utils';

type Option = { id: string; name: string };

export function VendorCombobox({
  workspaceId,
  value,
  options,
  onChange,
  onCreated,
}: {
  workspaceId: string;
  value: string | null;
  options: Option[];
  onChange: (id: string | null) => void;
  onCreated?: (vendor: Option) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pending, startTransition] = useTransition();
  const tErrors = useTranslations('errors');

  const selected = options.find((v) => v.id === value);
  const lower = search.trim().toLowerCase();
  const filtered = options.filter((v) => v.name.toLowerCase().includes(lower));
  const exactMatch = options.some((v) => v.name.toLowerCase() === lower);

  function handleCreate() {
    const name = search.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await createVendor({ workspaceId, name });
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      const created: Option = { id: result.data.vendorId, name: result.data.name };
      onCreated?.(created);
      onChange(created.id);
      setSearch('');
      setOpen(false);
      toast.success(`"${created.name}" agregado`);
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selected ? selected.name : 'Sin proveedor'}</span>
          <ChevronsUpDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar o crear…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filtered.length === 0 && !lower && (
              <CommandEmpty>Empezá a tipear para buscar.</CommandEmpty>
            )}
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <span className="text-muted-foreground">Sin proveedor</span>
                {value === null && <Check className="ml-auto size-4" />}
              </CommandItem>
              {filtered.map((v) => (
                <CommandItem
                  key={v.id}
                  value={v.id}
                  onSelect={() => {
                    onChange(v.id);
                    setOpen(false);
                  }}
                >
                  <span>{v.name}</span>
                  {value === v.id && <Check className="ml-auto size-4" />}
                </CommandItem>
              ))}
              {lower && !exactMatch && (
                <CommandItem
                  value="__create__"
                  onSelect={handleCreate}
                  className={cn(pending && 'opacity-50')}
                  disabled={pending}
                >
                  <Plus className="mr-2 size-4" />
                  Crear &ldquo;{search.trim()}&rdquo;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
