'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { ContentCard } from '@/components/layout/content-card';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';

const COLLAPSE_KEY = 'costo:sidebar-collapsed';

/**
 * Client shell (Linear "panel" layout). Server `(app)/layout.tsx` resolves
 * auth + workspace, then hands the data here so we own the interactive
 * collapse state without losing server-side data resolution.
 *
 * Structure: a flush sidebar over the canvas + a floating content card that
 * holds the slim chrome bar (collapse + breadcrumbs) and the page content.
 * Collapse state persists in localStorage; default is expanded on first visit.
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
  const [collapsed, setCollapsed] = useState(false);

  // Hydrate from localStorage. Can't render this server-side without a
  // hydration mismatch, so the first paint shows expanded and we flip on mount.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLAPSE_KEY) === '1') setCollapsed(true);
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
    <div className="flex h-svh overflow-hidden bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        email={email}
        workspace={workspace}
        workspaces={workspaces}
      />

      <div className="flex min-w-0 flex-1 flex-col p-0 sm:p-2 lg:pl-0">
        <ContentCard
          collapsed={collapsed}
          onToggleCollapse={toggle}
          email={email}
          workspace={workspace}
          workspaces={workspaces}
        >
          {children}
        </ContentCard>
      </div>
    </div>
  );
}
