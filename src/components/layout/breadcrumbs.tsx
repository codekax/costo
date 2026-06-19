'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const LOCALES = new Set(['es', 'en']);

/**
 * Maps a known route segment to its i18n key under `breadcrumbs`. Unknown
 * segments (dynamic ids — expense/project/workspace detail) fall back to the
 * generic `detail` label, since entity names aren't resolvable client-side.
 */
const SEGMENT_KEY: Record<string, string> = {
  dashboard: 'dashboard',
  expenses: 'expenses',
  projects: 'projects',
  categories: 'categories',
  vendors: 'vendors',
  import: 'import',
  settings: 'settings',
  profile: 'profile',
  workspaces: 'workspaces',
  members: 'members',
};

type Crumb = { label: string; path: string; href: string; isLast: boolean };

export function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations('breadcrumbs');

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && LOCALES.has(segments[0] ?? '')) segments.shift();

  // Only show breadcrumbs once we're nested. On a top-level page the single
  // crumb just duplicates the page's PageHeader title (the "header twice"
  // the user flagged), so render nothing and let the h1 be the title.
  if (segments.length < 2) return null;

  const crumbs: Crumb[] = segments.map((segment, index) => {
    const key = SEGMENT_KEY[segment];
    // `path` is the real cumulative route — always unique per crumb, so it's a
    // stable React key. `href` may be rewritten (e.g. `/settings` has no page
    // of its own → point it at its default sub-route), which can collide with
    // a sibling href; never key on it or reconciliation reuses stale crumbs.
    const path = '/' + segments.slice(0, index + 1).join('/');
    const href = path === '/settings' ? '/settings/profile' : path;
    return {
      label: key ? t(key) : t('detail'),
      path,
      href,
      isLast: index === segments.length - 1,
    };
  });

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.path}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem className="min-w-0">
              {crumb.isLast ? (
                <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href} className="truncate">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
