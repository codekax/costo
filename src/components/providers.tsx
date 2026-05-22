'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { useState, type ReactNode } from 'react';

import { AriaInvalidSync } from '@/components/aria-invalid-sync';

/**
 * App-level providers.
 *
 * QueryClient is created via `useState` factory so we get one instance per
 * client mount (App Router pattern — never instantiate at module scope, that
 * would leak state across users in SSR).
 *
 * Defaults are conservative:
 *  - staleTime 60s: most domain data (categories, vendors, projects) doesn't
 *    change in seconds, no need to refetch on every mount
 *  - gcTime 5min: keep cached data around long enough for back-nav to feel instant
 *  - refetchOnWindowFocus false: editorial app, not a trading dashboard
 *  - retry once: avoid hammering the server on transient errors
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <NuqsAdapter>
        <QueryClientProvider client={client}>
          <TooltipPrimitive.Provider delayDuration={150} skipDelayDuration={300}>
            <AriaInvalidSync />
            {children}
          </TooltipPrimitive.Provider>
        </QueryClientProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
