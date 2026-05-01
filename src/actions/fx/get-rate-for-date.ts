'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { getFxRateForDate, getLatestFxRate } from '@/lib/db/queries/daily-fx-rates';
import { logger } from '@/lib/logger';
import { actionError, actionOk, type ActionResult } from '@/actions/_shared';

const Schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fallbackToLatest: z.boolean().default(true),
});

export async function getRateForDate(
  input: unknown,
): Promise<ActionResult<{ rate: number; date: string } | null>> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return actionError('invalid_input');

  try {
    const supabase = await createServerClient();
    const direct = await getFxRateForDate(supabase, parsed.data.date);
    if (direct.available) return actionOk({ rate: direct.rate, date: direct.date });

    if (parsed.data.fallbackToLatest) {
      const latest = await getLatestFxRate(supabase);
      if (latest.available) return actionOk({ rate: latest.rate, date: latest.date });
    }

    return actionOk(null);
  } catch (error) {
    logger.error('fx.getRateForDate', { error });
    return actionError('unknown');
  }
}
