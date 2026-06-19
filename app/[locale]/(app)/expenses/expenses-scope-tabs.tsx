'use client';

import { useRouter } from 'next/navigation';
import { Layers, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { serializeScope, type Scope } from '@/lib/scope';

type ScopeTabsProps = {
  scope: Scope;
  projects: { id: string; name: string }[];
};

/**
 * Scope filter as a compact dropdown (Todos / Generales / per-project) so it
 * sits inline with the rest of the filter toolbar instead of eating a row of
 * pills. Selecting navigates via `?scope=`. The trigger reads as active (dark
 * fill) whenever the scope is narrower than "Todos".
 */
export function ExpensesScopeTabs({ scope, projects }: ScopeTabsProps) {
  const t = useTranslations('scopeTabs');
  const router = useRouter();

  const options = [
    { value: 'all', label: t('all'), href: '/expenses' },
    { value: 'general', label: t('general'), href: '/expenses?scope=general' },
    ...projects.map((p) => ({
      value: p.id,
      label: p.name,
      href: `/expenses?scope=${p.id}`,
    })),
  ];

  const activeKey = serializeScope(scope) ?? 'all';
  const active = options.find((o) => o.value === activeKey) ?? options[0]!;
  const isFiltered = activeKey !== 'all';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('label')}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] [font-weight:510] transition-colors sm:h-8 sm:text-xs',
            isFiltered
              ? 'border-foreground bg-foreground text-background'
              : 'border-border bg-card text-foreground hover:bg-muted',
          )}
        >
          <Layers className="size-4 shrink-0" aria-hidden />
          <span className="max-w-[160px] truncate">{active.label}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-52 overflow-y-auto">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onSelect={() => router.push(o.href, { scroll: false })}
            className={cn(o.value === activeKey && 'bg-muted [font-weight:510]')}
          >
            <span className="truncate">{o.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
