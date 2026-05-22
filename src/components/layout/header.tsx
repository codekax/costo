'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/actions/auth/sign-out';
import { MobileNav } from '@/components/layout/mobile-nav';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';
import { useTranslations } from 'next-intl';

/**
 * iOS-style top bar:
 *  - Sticky with backdrop blur (Apple Mail/Wallet header treatment)
 *  - Hairline separator using iOS systemSeparator color
 *  - User avatar as circular trigger for the account menu
 */
export function Header({
  email,
  workspace,
  workspaces,
}: {
  email: string;
  workspace: WorkspaceWithRole;
  workspaces: WorkspaceWithRole[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const t = useTranslations('header');

  return (
    <header
      className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6 lg:px-12"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center gap-3">
        <MobileNav active={workspace} workspaces={workspaces} />
        <div className="text-[17px] [font-weight:600] tracking-[-0.02em] lg:hidden">costo</div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('userMenu')}
            >
              <Avatar className="size-9">
                <AvatarFallback>{email.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="truncate px-3 py-2 text-xs text-muted-foreground">
              {email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push('/settings/profile')}>
              <UserIcon className="mr-2 size-4" />
              {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => startTransition(() => signOut())}
              variant="destructive"
            >
              <LogOut className="mr-2 size-4" />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
