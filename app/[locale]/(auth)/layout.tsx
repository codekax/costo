import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { CostoMark } from '@/components/brand/costo-logo';

/**
 * Linear-language auth shell: a single dark column, brand mark top-center,
 * the form on a narrow ~400px stack, quiet legal footer. The `.theme-linear`
 * scope re-binds the design tokens to Linear's dark + indigo palette for this
 * subtree only — the authenticated app keeps the Apple/iOS HIG language.
 */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/dashboard');

  const t = await getTranslations('landing');

  return (
    <main className="theme-linear flex min-h-svh flex-col bg-background text-foreground antialiased">
      <header className="flex justify-center px-6 pt-10 sm:pt-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
          aria-label="costo"
        >
          <CostoMark className="size-7 text-primary" />
          <span className="text-[19px] [font-weight:590] tracking-[-0.02em]">costo</span>
        </Link>
      </header>

      <div className="flex flex-1 items-start justify-center px-6 py-12 sm:items-center">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>

      <footer className="px-6 pb-8 text-center text-xs text-muted-foreground">
        {t('footerLegal')}
      </footer>
    </main>
  );
}
