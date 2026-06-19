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
 * Dense, neutral navigation list (Linear "panel" cadence). Rows are h-9 with a
 * single ink/grey identity — active gets a soft `bg-muted` fill + foreground
 * ink; inactive reads muted and lifts to foreground on hover. Reused by the
 * desktop sidebar and the mobile sheet. When `collapsed`, rows become icon-only
 * squares with a right-side tooltip.
 */
type NavItem = { href: string; icon: LucideIcon; key: string };

const navItems: readonly NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { href: '/expenses', icon: Receipt, key: 'expenses' },
  { href: '/projects', icon: Folder, key: 'projects' },
  { href: '/categories', icon: Tag, key: 'categories' },
  { href: '/vendors', icon: Users, key: 'vendors' },
  { href: '/import', icon: Upload, key: 'import' },
  { href: '/settings/profile', icon: Settings, key: 'settings' },
] as const;

export function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <nav aria-label={t('navigation')} className="flex-1 overflow-y-auto px-2 py-2">
      {!collapsed ? (
        <p className="px-2.5 pb-1.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground/70 [font-weight:590]">
          {t('navigation')}
        </p>
      ) : null}
      <ul className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.includes(item.href);
          const label = t(item.key);

          const link = (
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? label : undefined}
              className={cn(
                'group flex h-9 items-center rounded-lg text-sm tracking-[-0.01em] [font-weight:510] transition-colors',
                collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5',
                active
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <Icon
                className={cn(
                  'size-[18px] shrink-0 transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
                )}
                strokeWidth={active ? 2 : 1.75}
                aria-hidden
              />
              {!collapsed ? <span className="truncate">{label}</span> : null}
            </Link>
          );

          if (!collapsed) return <li key={item.key}>{link}</li>;
          return (
            <li key={item.key}>
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
