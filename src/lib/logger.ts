/* eslint-disable no-console */

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
