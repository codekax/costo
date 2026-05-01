import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import type { Database } from '@/types/db';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (options) cookieStore.set(name, value, options);
              else cookieStore.set(name, value);
            });
          } catch {
            // setAll called from a Server Component — middleware already refreshed the session
          }
        },
      },
    },
  );
}
