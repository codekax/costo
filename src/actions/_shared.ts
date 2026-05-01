import 'server-only';

export type ActionErrorCode =
  | 'invalid_input'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'stale'
  | 'limit_reached'
  | 'expired'
  | 'fx_unavailable'
  | 'storage_failed'
  | 'unknown';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ActionErrorCode; details?: Record<string, string[]> };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError<T = void>(
  error: ActionErrorCode,
  details?: Record<string, string[]>,
): ActionResult<T> {
  return details === undefined ? { ok: false, error } : { ok: false, error, details };
}
