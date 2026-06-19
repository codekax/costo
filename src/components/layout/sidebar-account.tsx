'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, LogOut, User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/actions/auth/sign-out';
import { cn } from '@/lib/utils';

/**
 * Account control pinned to the sidebar footer (Linear pattern). Avatar + email
 * open a menu with profile + sign-out. Used by the desktop sidebar and the
 * mobile sheet. When `collapsed`, only the avatar shows.
 */
export function SidebarAccount({
  email,
  collapsed = false,
}: {
  email: string;
  collapsed?: boolean;
}) {
  const t = useTranslations('header');
  const router = useRouter();
  const [, startTransition] = useTransition();
  const initial = email.charAt(0).toUpperCase();

  return (
    <div
      className="border-t border-border p-2"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t('userMenu')}
            className={cn(
              'flex w-full items-center rounded-lg p-1.5 text-left transition-colors hover:bg-muted/60',
              collapsed ? 'justify-center' : 'gap-2',
            )}
          >
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initial}</AvatarFallback>
            </Avatar>
            {!collapsed ? (
              <>
                <span className="min-w-0 flex-1 truncate text-[13px] [font-weight:510]">
                  {email}
                </span>
                <ChevronsUpDown
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </>
            ) : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-60">
          <div className="truncate px-3 py-2 text-xs text-muted-foreground">{email}</div>
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
  );
}
