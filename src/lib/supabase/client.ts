'use client';

import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { env } from '@/config/env';
import type { Database } from '@/types/db';

export function createBrowserClient() {
  return createSupabaseBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
