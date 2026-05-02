import type { ReactNode } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { requireWorkspaceContext } from '@/lib/workspace-context';

/**
 * Server layout: resolves auth + workspace, hands the data to the client
 * AppShell which manages interactive layout state (collapse / expand).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, workspace, workspaces } = await requireWorkspaceContext();

  return (
    <AppShell email={user.email ?? ''} workspace={workspace} workspaces={workspaces}>
      {children}
    </AppShell>
  );
}
