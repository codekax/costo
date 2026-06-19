'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MobileNav } from '@/components/layout/mobile-nav';
import { usePageTitle } from '@/components/layout/use-page-title';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';

/**
 * Slim chrome bar at the top of the content card: sidebar collapse trigger
 * (lg) or mobile menu (<lg) on the left, then the current screen title (Linear
 * pattern — the title lives here, not as a big in-page h1). Each screen
 * publishes its title via <PageTitle>.
 */
export function ContentHeader({
  collapsed,
  onToggleCollapse,
  email,
  workspace,
  workspaces,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  email: string;
  workspace: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
}) {
  const t = useTranslations('nav');
  const title = usePageTitle((s) => s.title);
  const toggleLabel = collapsed ? t('expandSidebar') : t('collapseSidebar');

  return (
    <div
      className="flex h-12 shrink-0 items-center gap-1.5 border-b border-border px-2 sm:px-3"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <MobileNav active={workspace} workspaces={workspaces} email={email} />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            aria-label={toggleLabel}
            className="hidden lg:inline-flex"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{toggleLabel}</TooltipContent>
      </Tooltip>

      {title ? (
        <span className="truncate text-sm [font-weight:510] text-foreground">
          {title}
        </span>
      ) : null}
    </div>
  );
}
