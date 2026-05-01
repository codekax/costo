'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, Check, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { setActiveWorkspace } from '@/actions/workspaces/set-active';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';

export function WorkspaceSwitcher({
  active,
  workspaces,
}: {
  active: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSelect(id: string) {
    if (id === active.id) return;
    startTransition(async () => {
      await setActiveWorkspace({ workspaceId: id });
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          aria-label="Cambiar workspace"
          disabled={pending}
        >
          <span className="truncate">{active.name}</span>
          <ChevronsUpDown className="size-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => onSelect(ws.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="text-sm">{ws.name}</span>
              <span className="text-xs text-muted-foreground">
                {ws.kind === 'personal' ? 'personal' : 'compartido'} · {ws.role}
              </span>
            </div>
            {ws.id === active.id ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/settings/workspaces')}>
          <Plus className="mr-2 size-4" />
          Nuevo workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
