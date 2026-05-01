-- Local dev seed. Run with `supabase db reset` (which auto-loads this file).
-- For cloud production, the Edge Function `daily-fx-fetch` populates this on schedule.

-- Seed a default FX rate so the form works in dev before the cron runs.
insert into public.daily_fx_rates (date, ars_per_usd_official, source)
values (current_date, 1050, 'dev-seed')
on conflict (date) do nothing;
