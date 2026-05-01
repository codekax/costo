import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { Sidebar } from '@/components/layout/sidebar';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { Header } from '@/components/layout/header';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const ws = await getActiveWorkspace();
  if (!ws) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Configurando tu workspace inicial… recargá en un momento.
        </p>
      </main>
    );
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r bg-muted/20 lg:flex lg:flex-col">
        <div className="border-b p-3">
          <WorkspaceSwitcher active={ws.active} workspaces={ws.all} />
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar />
        </div>
      </aside>
      <div className="flex flex-col">
        <Header email={user.email ?? ''} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
