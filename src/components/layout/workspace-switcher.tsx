'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('workspaceSwitcher');
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
          variant="secondary"
          size="sm"
          className="w-full justify-between rounded-full px-4"
          aria-label={t('ariaLabel')}
          disabled={pending}
        >
          <span className="truncate">{active.name}</span>
          <ChevronDown className="size-4 opacity-50" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>{t('groupLabel')}</DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => onSelect(ws.id)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="text-sm [font-weight:500]">{ws.name}</span>
              <span className="text-xs text-muted-foreground [font-weight:450]">
                {ws.kind === 'personal' ? t('personal') : t('shared')} · {ws.role}
              </span>
            </div>
            {ws.id === active.id ? <Check className="size-4" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/settings/workspaces')}>
          <Plus className="mr-2 size-4" />
          {t('newWorkspace')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
