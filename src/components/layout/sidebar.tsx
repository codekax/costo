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
  type LucideIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Apple Mail / Reminders-style sidebar.
 *
 * Each item carries an identity color in the icon stroke — never as a full
 * tile background. Inactive items render slightly muted (lower opacity,
 * thinner stroke) so the row reads as navigation, not as a category dump.
 * Active items get a soft `bg-muted` fill + a heavier, fully-saturated icon
 * and bold label so the current section is unmistakable.
 *
 * When `collapsed`, items shrink to an icon-only square with a tooltip.
 */
type NavItem = {
  href: string;
  icon: LucideIcon;
  key: string;
  /** Identity color (iOS system palette) applied to the icon stroke. */
  color: string;
};

const navItems: readonly NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard', color: '#0a84ff' }, // blue
  { href: '/expenses', icon: Receipt, key: 'expenses', color: '#ff9500' }, // orange
  { href: '/projects', icon: Folder, key: 'projects', color: '#34c759' }, // green
  { href: '/categories', icon: Tag, key: 'categories', color: '#af52de' }, // purple
  { href: '/vendors', icon: Users, key: 'vendors', color: '#ff2d55' }, // pink
  { href: '/import', icon: Upload, key: 'import', color: '#5ac8fa' }, // sky
  { href: '/settings/profile', icon: Settings, key: 'settings', color: '#8e8e93' }, // gray
] as const;

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav className={cn('flex flex-col gap-0.5', collapsed ? 'items-center px-2' : 'px-2')}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname.includes(item.href);
        const label = t(item.key);

        const link = (
          <Link
            key={item.key}
            href={item.href}
            aria-label={collapsed ? label : undefined}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group flex items-center rounded-xl transition-colors',
              collapsed ? 'size-10 justify-center' : 'gap-3 px-2.5 py-2',
              active ? 'bg-muted' : 'hover:bg-muted/60',
            )}
          >
            <Icon
              className={cn(
                'size-[18px] shrink-0 transition-[opacity,stroke-width]',
                active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
              )}
              style={{ color: item.color }}
              strokeWidth={active ? 2.25 : 1.75}
              aria-hidden
            />
            <span
              className={cn(
                collapsed ? 'sr-only' : 'truncate text-[15px] tracking-[-0.01em] text-foreground',
                active ? '[font-weight:600]' : '[font-weight:500]',
              )}
            >
              {label}
            </span>
          </Link>
        );

        if (!collapsed) return link;
        return (
          <Tooltip key={item.key}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}
