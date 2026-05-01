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

export function Sidebar() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname.includes(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              active && 'bg-accent text-accent-foreground font-medium',
            )}
          >
            <Icon className="size-4" />
            <span>{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
