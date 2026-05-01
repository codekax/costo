// Edge Function: daily-fx-fetch
// Fetches the official ARS/USD rate from dolarapi.com once per day and upserts
// it into daily_fx_rates. Idempotent. Service role usage — bypasses RLS.
//
// Schedule (configure in Supabase Dashboard → Edge Functions → Cron):
//   cron: "0 12 * * *"   (12:00 UTC ≈ 09:00 Buenos Aires, after dolarapi update)

// @ts-nocheck — Deno runtime, not Node.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const DOLARAPI_BASE_URL = Deno.env.get('DOLARAPI_BASE_URL') ?? 'https://dolarapi.com/v1';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchOfficialRate(): Promise<number> {
  const attempts = [1000, 5000, 30000];
  let lastError: unknown;

  for (let i = 0; i <= attempts.length; i++) {
    try {
      const res = await fetch(`${DOLARAPI_BASE_URL}/dolares/oficial`, {
        headers: { accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`dolarapi http ${res.status}`);
      const json = await res.json();
      const rate = Number(json?.venta);
      if (!Number.isFinite(rate) || rate <= 0) {
        throw new Error(`dolarapi unexpected payload: ${JSON.stringify(json).slice(0, 200)}`);
      }
      return rate;
    } catch (error) {
      lastError = error;
      if (i < attempts.length) {
        await new Promise((r) => setTimeout(r, attempts[i]));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('dolarapi unreachable');
}

Deno.serve(async () => {
  try {
    const rate = await fetchOfficialRate();
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase
      .from('daily_fx_rates')
      .upsert(
        {
          date: today,
          ars_per_usd_official: rate,
          source: 'dolarapi.com',
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'date' },
      );

    if (error) throw error;

    console.log(`fx.dailyFetch ok rate=${rate} date=${today}`);
    return new Response(JSON.stringify({ ok: true, rate, date: today }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error('fx.dailyFetch error', error);
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
});
