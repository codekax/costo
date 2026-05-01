import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';
import type { Category } from '@/types/domain';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export async function getCategories(supabase: Db, workspaceId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
