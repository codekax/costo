import Link from 'next/link';
import type { ReactNode } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { User, Users2, ShieldAlert, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Settings two-column layout (Linear).
 *
 *  - Desktop (lg+): sticky section nav on the left, content on the right.
 *    Neutral icons + medium labels — the dense Linear settings idiom.
 *  - Mobile/tablet: sections collapse into a horizontal scroll bar of pill
 *    chips above the content.
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

  const sections: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/settings/profile', label: t('navProfile'), icon: User },
    { href: '/settings/workspaces', label: t('navWorkspaces'), icon: Users2 },
    { href: '/settings/account', label: t('navAccount'), icon: ShieldAlert },
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
                  className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card px-3 text-[13px] [font-weight:510] text-foreground transition-colors hover:bg-muted"
                >
                  <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop: vertical neutral list */}
        <ul className="hidden flex-col gap-0.5 lg:flex">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={cn(
                    'group flex h-9 items-center gap-2.5 rounded-lg px-2.5 transition-colors',
                    'text-[13px] tracking-[-0.01em] text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon
                    className="size-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className="truncate [font-weight:510]">{s.label}</span>
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
