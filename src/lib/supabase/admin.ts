import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import type { Database } from '@/types/db';

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin client');
}

/**
 * Service role Supabase client — bypasses RLS.
 * NEVER import from app/, src/components, src/hooks, or any client-reachable code.
 * Use only inside Edge Functions / scheduled jobs that need elevated privileges.
 */
export const supabaseAdmin = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
