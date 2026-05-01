'use client';

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { env } from '@/config/env';

export function createBrowserClient() {
  return createSupabaseBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
