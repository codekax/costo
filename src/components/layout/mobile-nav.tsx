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
import { Sidebar } from '@/components/layout/sidebar';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';

/**
 * Mobile / small-screen navigation. Renders a hamburger button in the Header
 * (only visible <lg) that opens a Sheet with the Sidebar inside.
 */
export function MobileNav({
  active,
  workspaces,
}: {
  active: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
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
        <Button variant="ghost" size="icon" aria-label={t('openMenu')} className="lg:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(20rem,85vw)] bg-card p-0">
        <SheetHeader
          className="border-b border-border p-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          <SheetTitle className="sr-only">{t('navigation')}</SheetTitle>
          <WorkspaceSwitcher active={active} workspaces={workspaces} />
        </SheetHeader>
        <div
          className="py-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
        >
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
}
