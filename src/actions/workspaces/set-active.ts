'use server';

import { revalidatePath } from 'next/cache';
import { setActiveWorkspaceCookie } from '@/lib/active-workspace';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import { z } from 'zod';

const Schema = z.object({ workspaceId: z.string().uuid() });

export async function setActiveWorkspace(input: unknown): Promise<ActionResult> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');
  await setActiveWorkspaceCookie(parsed.data.workspaceId);
  revalidatePath('/', 'layout');
  return actionOk(undefined);
}
