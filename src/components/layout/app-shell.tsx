'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/layout/sidebar';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';

const COLLAPSE_KEY = 'costo:sidebar-collapsed';

/**
 * Client shell that owns the collapsed-sidebar state.
 *
 * Server `(app)/layout.tsx` resolves auth+workspace, then hands the data here
 * so we can manage interactive layout (collapse / expand) without losing
 * server-side data resolution. State persists in localStorage; default is
 * expanded on first visit.
 *
 * Header h-16 + sidebar header h-16 are intentional — they share the same
 * border-bottom row so the top hairline runs continuous across the screen.
 */
export function AppShell({
  email,
  workspace,
  workspaces,
  children,
}: {
  email: string;
  workspace: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
  children: ReactNode;
}) {
  const t = useTranslations('nav');
  const [collapsed, setCollapsed] = useState(false);

  // Hydrate from localStorage. We can't render this server-side without
  // hitting a hydration mismatch, so the initial paint always shows expanded
  // and we flip on mount if needed (cheap; happens before paint commit on most cases).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COLLAPSE_KEY);
      if (stored === '1') setCollapsed(true);
    } catch {
      // localStorage may be blocked (private mode) — keep default
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div
      className={cn(
        'grid min-h-screen grid-cols-1 bg-background transition-[grid-template-columns] duration-200',
        collapsed ? 'lg:grid-cols-[72px_1fr]' : 'lg:grid-cols-[260px_1fr]',
      )}
    >
      <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col">
        {/* Top section — same h-16 as Header so hairlines align horizontally */}
        <div
          className={cn(
            'flex h-16 items-center border-b border-border',
            collapsed ? 'justify-center px-2' : 'px-4',
          )}
        >
          {collapsed ? (
            <div
              className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm [font-weight:500]"
              aria-label={workspace.name}
              title={workspace.name}
            >
              {workspace.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <WorkspaceSwitcher active={workspace} workspaces={workspaces} />
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <Sidebar collapsed={collapsed} />
        </div>

        {/* Footer with collapse toggle */}
        <div
          className={cn(
            'flex h-12 items-center border-t border-border',
            collapsed ? 'justify-center px-2' : 'justify-between px-4',
          )}
        >
          {!collapsed ? (
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden />
              costo
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
            title={collapsed ? t('expandSidebar') : t('collapseSidebar')}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <Header email={email} workspace={workspace} workspaces={workspaces} />
        <main className="mx-auto w-full flex-1 overflow-y-auto px-6 py-10 lg:px-12 lg:py-14">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
