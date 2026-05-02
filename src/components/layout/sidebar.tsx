'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Folder,
  Tag,
  Users,
  Upload,
  Settings,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/expenses', icon: Receipt, key: 'expenses' },
  { href: '/projects', icon: Folder, key: 'projects' },
  { href: '/categories', icon: Tag, key: 'categories' },
  { href: '/vendors', icon: Users, key: 'vendors' },
  { href: '/import', icon: Upload, key: 'import' },
  { href: '/settings/profile', icon: Settings, key: 'settings' },
] as const;

/**
 * Mastercard-language sidebar:
 *  - Active item: full Ink pill (primary CTA shape, weight 500)
 *  - Inactive: cream surface, slate-gray text, subtle hover
 *  - Pill nav language: every item is rounded-full
 *  - When `collapsed`, items shrink to 40px square pills with icon-only +
 *    native `title` tooltip; label still rendered as `sr-only` for a11y.
 */
export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex flex-col gap-1.5',
        collapsed ? 'items-center px-2' : 'px-3',
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname.includes(item.href);
        const label = t(item.key);
        return (
          <Link
            key={item.key}
            href={item.href}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={cn(
              'flex items-center rounded-full text-sm tracking-[-0.32px] transition-colors',
              collapsed
                ? 'size-10 justify-center'
                : 'gap-3 px-4 py-2.5',
              active
                ? 'bg-primary text-primary-foreground [font-weight:500]'
                : 'text-muted-foreground [font-weight:450] hover:bg-foreground/5 hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className={collapsed ? 'sr-only' : undefined}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
