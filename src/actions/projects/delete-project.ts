'use server';

import { DeleteProjectSchema } from '@/lib/schemas/project';
import {
  actionError,
  actionOk,
  defineAction,
  type ActionResult,
} from '@/actions/_define-action';

const impl = defineAction<typeof DeleteProjectSchema, void>({
  schema: DeleteProjectSchema,
  context: 'projects.deleteProject',
  revalidate: ['/projects', '/dashboard'],
  handler: async ({ data, supabase }) => {
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', data.id)
      .maybeSingle();

    if (!project) return actionError('not_found');
    if (project.name !== data.confirmation) return actionError('invalid_input');

    const { error } = await supabase.from('projects').delete().eq('id', data.id);
    if (error) throw error;
    return actionOk(undefined);
  },
});

export async function deleteProject(input: unknown): Promise<ActionResult<void>> {
  return impl(input);
}
