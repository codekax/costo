import type { ReactNode } from 'react';

import { ContentHeader } from '@/components/layout/content-header';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';

/**
 * Floating content panel (Linear "card" shell): a single `bg-card` surface with
 * a hairline + rounded corners on sm+, full-bleed on mobile. Owns the slim
 * chrome bar (collapse + breadcrumbs) and the internal scroll; each screen
 * renders its own PageHeader below it.
 */
export function ContentCard({
  children,
  collapsed,
  onToggleCollapse,
  email,
  workspace,
  workspaces,
}: {
  children: ReactNode;
  collapsed: boolean;
  onToggleCollapse: () => void;
  email: string;
  workspace: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
}) {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-card sm:rounded-xl sm:border">
      <ContentHeader
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        email={email}
        workspace={workspace}
        workspaces={workspaces}
      />
      <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
      </div>
    </main>
  );
}
