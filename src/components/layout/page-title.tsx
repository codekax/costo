'use client';

import { useEffect } from 'react';

import { usePageTitle } from '@/components/layout/use-page-title';

/**
 * Declares the screen title shown in the top bar (ContentHeader). Render it
 * near the top of a page — it paints nothing itself, just publishes the title
 * to the shell and clears it on unmount. Use the entity name on detail pages.
 */
export function PageTitle({ children }: { children: string }) {
  const setTitle = usePageTitle((s) => s.setTitle);

  useEffect(() => {
    setTitle(children);
    return () => setTitle(null);
  }, [children, setTitle]);

  return null;
}
