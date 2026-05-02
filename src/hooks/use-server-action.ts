'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { ActionResult } from '@/actions/_shared';

export type UseServerActionOptions<TOutput> = {
  /** Toast text to show on success — should be already translated. */
  successMessage?: string;
  /** Push to this path on success (skips if absent). */
  navigate?: string;
  /** Call `router.refresh()` after success (default: true if no navigate, false if navigate). */
  refresh?: boolean;
  /** Hook into the success branch (close dialog, reset form, etc). */
  onSuccess?: (data: TOutput) => void;
  /** Override the i18n namespace used to translate `result.error`. */
  errorNamespace?: string;
};

/**
 * Wraps the boilerplate every form/mutation in this app repeats:
 *   useTransition + startTransition(async () => {
 *     const r = await action(input);
 *     if (!r.ok) toast.error(tErrors(r.error));
 *     else { toast.success(...); router.push(...); router.refresh(); }
 *   })
 *
 * Returns `{ run, pending }`. The form decides how to call `run` (typically
 * inside `form.handleSubmit(values => run(values))`).
 */
export function useServerAction<TInput, TOutput>(
  action: (input: TInput) => Promise<ActionResult<TOutput>>,
  options: UseServerActionOptions<TOutput> = {},
): {
  run: (input: TInput) => void;
  pending: boolean;
} {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const tErrors = useTranslations(options.errorNamespace ?? 'errors');

  function run(input: TInput): void {
    startTransition(async () => {
      const result = await action(input);
      if (!result.ok) {
        toast.error(tErrors(result.error));
        return;
      }
      if (options.successMessage) toast.success(options.successMessage);
      options.onSuccess?.(result.data);
      if (options.navigate) {
        router.push(options.navigate);
      }
      // Default: refresh when no navigate (stay on page), don't double-refresh on navigate
      const shouldRefresh = options.refresh ?? !options.navigate;
      if (shouldRefresh) router.refresh();
    });
  }

  return { run, pending };
}
