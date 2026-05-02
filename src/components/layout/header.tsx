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
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { MobileNav } from '@/components/layout/mobile-nav';
import type { WorkspaceWithRole } from '@/lib/db/queries/workspaces';
import { useTranslations } from 'next-intl';

/**
 * Mastercard-language top header:
 *  - Sticky on cream-tinted blur — picks up the canvas warmth
 *  - Hairline border bottom on Dust Taupe
 *  - User menu trigger uses circular avatar (Mastercard's portrait vocabulary)
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
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur-md lg:px-12">
      <div className="flex items-center gap-3">
        <MobileNav active={workspace} workspaces={workspaces} />
        <div className="text-base [font-weight:500] tracking-[-0.32px] lg:hidden">costo</div>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
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
            <div className="px-3 py-2 text-xs text-muted-foreground [font-weight:450] truncate">
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
