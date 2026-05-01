'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type ScopeTabsProps = {
  scope: 'all' | 'general' | string;
  projects: { id: string; name: string }[];
};

export function ExpensesScopeTabs({ scope, projects }: ScopeTabsProps) {
  const tabs = [
    { value: 'all' as const, label: 'Todos' },
    { value: 'general' as const, label: 'Generales' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  return (
    <div className="flex flex-wrap gap-2 border-b pb-3">
      {tabs.map((tab) => {
        const active = tab.value === scope;
        return (
          <Link
            key={tab.value}
            href={tab.value === 'all' ? '/expenses' : `/expenses?scope=${tab.value}`}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:bg-accent',
            )}
            scroll={false}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
