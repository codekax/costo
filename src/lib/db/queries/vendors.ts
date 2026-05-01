import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';
import type { Vendor } from '@/types/domain';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export async function getVendors(supabase: Db, workspaceId: string): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
