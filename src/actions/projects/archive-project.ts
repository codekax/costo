'use server';

import { ArchiveProjectSchema } from '@/lib/schemas/project';
import { actionOk, defineAction, type ActionResult } from '@/actions/_define-action';

const impl = defineAction<typeof ArchiveProjectSchema, void>({
  schema: ArchiveProjectSchema,
  context: 'projects.archiveProject',
  revalidate: ['/projects', '/projects/archived'],
  handler: async ({ data, supabase }) => {
    const { error } = await supabase
      .from('projects')
      .update({ archived_at: data.archive ? new Date().toISOString() : null })
      .eq('id', data.id);

    if (error) throw error;
    return actionOk(undefined);
  },
});

export async function archiveProject(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
