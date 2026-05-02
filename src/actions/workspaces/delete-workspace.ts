'use server';

import { DeleteWorkspaceSchema } from '@/lib/schemas/workspace';
import {
  actionError,
  actionOk,
  defineAction,
  type ActionResult,
} from '@/actions/_define-action';

const impl = defineAction<typeof DeleteWorkspaceSchema, void>({
  schema: DeleteWorkspaceSchema,
  context: 'workspaces.deleteWorkspace',
  workspaceId: (data) => data.id,
  revalidate: ['/settings/workspaces', '/'],
  handler: async ({ data, supabase }) => {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('name, kind')
      .eq('id', data.id)
      .maybeSingle();

    if (!ws) return actionError('not_found');
    if (ws.name !== data.confirmation) return actionError('invalid_input');
    if (ws.kind === 'personal') return actionError('forbidden');

    const { error } = await supabase.from('workspaces').delete().eq('id', data.id);
    if (error) throw error;
    return actionOk(undefined);
  },
});

export async function deleteWorkspace(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
