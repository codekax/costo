'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { serializeScope, type Scope } from '@/lib/scope';

type ScopeTabsProps = {
  scope: Scope;
  projects: { id: string; name: string }[];
};

type Tab = { value: string; label: string; href: string };

export function ExpensesScopeTabs({ scope, projects }: ScopeTabsProps) {
  const t = useTranslations('scopeTabs');
  const tabs: Tab[] = [
    { value: 'all', label: t('all'), href: '/expenses' },
    { value: 'general', label: t('general'), href: '/expenses?scope=general' },
    ...projects.map((p) => ({
      value: p.id,
      label: p.name,
      href: `/expenses?scope=${p.id}`,
    })),
  ];

  const activeKey = serializeScope(scope) ?? 'all';

  return (
    <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
      {tabs.map((tab) => {
        const active = tab.value === activeKey;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              active
                ? 'border-foreground bg-foreground text-background'
                : 'border-border hover:bg-foreground/5',
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
