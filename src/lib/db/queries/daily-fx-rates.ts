import 'server-only';

import type { createServerClient } from '@/lib/supabase/server';

type Db = Awaited<ReturnType<typeof createServerClient>>;

export type FxRateLookup =
  | { available: true; rate: number; date: string }
  | { available: false };

/**
 * Returns the official ARS-per-USD rate for a given date.
 * If unavailable, the caller must require the user to enter a manual rate.
 */
export async function getFxRateForDate(supabase: Db, date: string): Promise<FxRateLookup> {
  const { data, error } = await supabase
    .from('daily_fx_rates')
    .select('date, ars_per_usd_official')
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { available: false };

  return { available: true, rate: Number(data.ars_per_usd_official), date: data.date };
}

export async function getLatestFxRate(supabase: Db): Promise<FxRateLookup> {
  const { data, error } = await supabase
    .from('daily_fx_rates')
    .select('date, ars_per_usd_official')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { available: false };

  return { available: true, rate: Number(data.ars_per_usd_official), date: data.date };
}
