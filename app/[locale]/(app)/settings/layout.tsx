import Link from 'next/link';
import type { ReactNode } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { User, Users2, ShieldAlert, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * iOS Settings-style two-column layout.
 *
 *  - Desktop (lg+): sticky sidebar with section links, content on the right.
 *    Active link gets `bg-muted` + bold label; iOS Mail/Settings idiom.
 *  - Mobile/tablet: sections collapse into a single horizontal scroll bar
 *    of chip-style links above the content. The chips are touch-friendly
 *    (36px tall) and rounded-full for that segmented-control feel.
 */
export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('settings');

  const sections: { href: string; label: string; icon: LucideIcon; color: string }[] = [
    { href: '/settings/profile', label: t('navProfile'), icon: User, color: '#0a84ff' },
    { href: '/settings/workspaces', label: t('navWorkspaces'), icon: Users2, color: '#34c759' },
    { href: '/settings/account', label: t('navAccount'), icon: ShieldAlert, color: '#ff3b30' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav aria-label={t('navProfile')} className="lg:sticky lg:top-6 lg:h-fit">
        {/* Mobile / tablet: horizontal scroll chip bar */}
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href} className="shrink-0">
                <Link
                  href={s.href}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-[13px] [font-weight:500] text-foreground transition-colors hover:bg-muted"
                >
                  <Icon className="size-4" style={{ color: s.color }} strokeWidth={2} aria-hidden />
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop: vertical list with iOS Mail-style coloured icons */}
        <ul className="hidden flex-col gap-0.5 lg:flex">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors',
                    'text-[15px] tracking-[-0.01em] text-foreground hover:bg-muted/60',
                  )}
                >
                  <Icon
                    className="size-[18px] shrink-0 opacity-80 transition-opacity group-hover:opacity-100"
                    style={{ color: s.color }}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className="truncate [font-weight:500]">{s.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
