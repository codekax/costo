import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';
import type { z } from 'zod';
import type { User } from '@supabase/supabase-js';

import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';
import {
  getWorkspaceContext,
  requireWorkspaceMembership,
} from '@/lib/workspace-context';
import type { createServerClient } from '@/lib/supabase/server';
import type { WorkspaceRole } from '@/types/domain';

type Db = Awaited<ReturnType<typeof createServerClient>>;

type Revalidator<TData> =
  | ReadonlyArray<string | null | undefined>
  | ((data: TData) => ReadonlyArray<string | null | undefined>);

type DefineActionConfig<TSchema extends z.ZodTypeAny, TOutput> = {
  schema: TSchema;
  /** Logger context — `<feature>.<action>`. */
  context: string;
  /** Workspace ID extractor → enables membership check + supabase/user/role injection. */
  workspaceId?: (data: z.output<TSchema>) => string;
  /** Paths to revalidate on success (statics or fn(data)). `null` skipped. */
  revalidate?: Revalidator<z.output<TSchema>>;
  /** Cache tags to revalidate on success. */
  tags?: Revalidator<z.output<TSchema>>;
  /** Real work. Return `actionOk(value)` or `actionError(code)`. Wrapper catches throws. */
  handler: (ctx: {
    data: z.output<TSchema>;
    supabase: Db;
    user: User;
    role: WorkspaceRole;
  }) => Promise<ActionResult<TOutput>>;
};

/**
 * Centralised Server Action pipeline:
 *   1. Zod parse → return `invalid_input` on failure
 *   2. Optional workspace membership check → return guard error
 *   3. Run handler inside try/catch
 *   4. Translate Postgres unique violation (23505) to `conflict`
 *   5. Revalidate paths/tags on success
 *   6. Log + return `unknown` on uncaught throws
 */
export function defineAction<TSchema extends z.ZodTypeAny, TOutput>(
  config: DefineActionConfig<TSchema, TOutput>,
): (input: unknown) => Promise<ActionResult<TOutput>> {
  return async function action(input: unknown): Promise<ActionResult<TOutput>> {
    const parsed = config.schema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
      return actionError('invalid_input', fieldErrors);
    }
    const data = parsed.data as z.output<TSchema>;

    let supabase: Db;
    let user: User;
    let role: WorkspaceRole;

    if (config.workspaceId) {
      const guard = await requireWorkspaceMembership(config.workspaceId(data));
      if (!guard.ok) return actionError(guard.reason);
      supabase = guard.supabase;
      user = guard.user;
      role = guard.role;
    } else {
      const ctx = await getWorkspaceContext();
      if (!ctx) return actionError('unauthenticated');
      supabase = ctx.supabase;
      user = ctx.user;
      role = ctx.role;
    }

    try {
      const result = await config.handler({ data, supabase, user, role });
      if (!result.ok) return result;

      if (config.revalidate) {
        const paths =
          typeof config.revalidate === 'function' ? config.revalidate(data) : config.revalidate;
        for (const path of paths) {
          if (path) revalidatePath(path);
        }
      }
      if (config.tags) {
        const tags = typeof config.tags === 'function' ? config.tags(data) : config.tags;
        for (const tag of tags) {
          if (tag) revalidateTag(tag);
        }
      }
      return result;
    } catch (error) {
      const code = (error as { code?: string } | undefined)?.code;
      if (code === '23505') return actionError('conflict');
      logger.error(config.context, { error });
      return actionError('unknown');
    }
  };
}

export { actionError, actionOk, type ActionResult };
