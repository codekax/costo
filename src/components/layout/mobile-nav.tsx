'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { SidebarAccount } from '@/components/layout/sidebar-account';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';

/**
 * Mobile / small-screen navigation. Renders a hamburger button in the content
 * header (only <lg) that opens a Sheet mirroring the desktop sidebar: workspace
 * switcher on top, nav in the middle, account control at the bottom.
 */
export function MobileNav({
  active,
  workspaces,
  email,
}: {
  active: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
  email: string;
}) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Auto-close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('openMenu')}
          className="lg:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-[min(20rem,85vw)] flex-col bg-card p-0">
        <SheetHeader
          className="border-b border-border p-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
          <SheetTitle className="sr-only">{t('navigation')}</SheetTitle>
          <WorkspaceSwitcher active={active} workspaces={workspaces} />
        </SheetHeader>
        <SidebarNav onNavigate={() => setOpen(false)} />
        <SidebarAccount email={email} />
      </SheetContent>
    </Sheet>
  );
}
