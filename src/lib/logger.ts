/* eslint-disable no-console */

/**
 * Universal logger — used by both server and client components.
 *
 * Reads `process.env.NODE_ENV` directly (always available in both runtimes
 * and stable across Next.js bundles). Do NOT import the Zod-validated `env`
 * here: that module fails in the client bundle because it validates
 * server-only secrets that aren't present client-side, which crashes
 * any client component (e.g. `error.tsx`) that imports the logger.
 */

const isDev = process.env.NODE_ENV !== 'production';

type LogPayload = Record<string, unknown> | undefined;

export const logger = {
  info(ctx: string, data?: LogPayload): void {
    if (isDev) console.info(`[${ctx}]`, data ?? '');
  },
  warn(ctx: string, data?: LogPayload): void {
    if (isDev) console.warn(`[${ctx}]`, data ?? '');
    // production: forward to Sentry when configured (wired in Phase 13)
  },
  error(ctx: string, data?: LogPayload): void {
    if (isDev) console.error(`[${ctx}]`, data ?? '');
    // production: forward to Sentry when configured (wired in Phase 13)
  },
};
