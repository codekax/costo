import Link from 'next/link';
import type { ReactNode } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { User, Users2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const sections = [
    { href: '/settings/profile', label: t('navProfile'), icon: User },
    { href: '/settings/workspaces', label: t('navWorkspaces'), icon: Users2 },
    { href: '/settings/account', label: t('navAccount'), icon: ShieldAlert },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <nav className="lg:sticky lg:top-6 lg:h-fit">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors',
                    'hover:bg-foreground/5',
                  )}
                >
                  <Icon className="size-4" />
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div>{children}</div>
    </div>
  );
}
