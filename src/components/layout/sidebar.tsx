'use client';

import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { SidebarAccount } from '@/components/layout/sidebar-account';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';

const SIDEBAR_WIDTH = 248;
const SIDEBAR_WIDTH_COLLAPSED = 64;

/**
 * Desktop sidebar (lg+). Sits flush on the canvas (no border / no fill) — the
 * floating content card next to it carries the separation. Top holds the
 * workspace switcher, footer holds the account control, nav fills the middle.
 * Width animates between expanded and collapsed.
 */
export function Sidebar({
  collapsed,
  email,
  workspace,
  workspaces,
}: {
  collapsed: boolean;
  email: string;
  workspace: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
}) {
  return (
    <aside
      aria-label="Primary navigation"
      className="hidden shrink-0 flex-col overflow-hidden transition-[width] duration-200 ease-out lg:flex"
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
    >
      <div
        className={cn(
          'flex h-14 items-center',
          collapsed ? 'justify-center px-2' : 'px-3',
        )}
      >
        {collapsed ? (
          <div
            className="flex size-9 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground [font-weight:590]"
            title={workspace.name}
            aria-label={workspace.name}
          >
            {workspace.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <WorkspaceSwitcher active={workspace} workspaces={workspaces} />
        )}
      </div>

      <SidebarNav collapsed={collapsed} />
      <SidebarAccount email={email} collapsed={collapsed} />
    </aside>
  );
}
