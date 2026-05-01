-- Migration 0005 — daily_fx_rates with immutability triggers (constitution principle IV)

create table public.daily_fx_rates (
  date date primary key,
  ars_per_usd_official numeric(14, 6) not null check (ars_per_usd_official > 0),
  source text not null default 'dolarapi.com',
  fetched_at timestamptz not null default now()
);

alter table public.daily_fx_rates enable row level security;

-- Read-only for any authenticated user; writes only via service role
create policy fx_select on public.daily_fx_rates for select
  to authenticated
  using (true);

-- Block UPDATE / DELETE older than 2 hours (correction window only)
create or replace function public.enforce_fx_immutability()
returns trigger
language plpgsql
as $$
begin
  if old.fetched_at < now() - interval '2 hours' then
    raise exception 'Cannot modify daily_fx_rates older than 2 hours';
  end if;
  return new;
end;
$$;

create trigger fx_immutable_update
before update on public.daily_fx_rates
for each row execute function public.enforce_fx_immutability();

create or replace function public.block_fx_delete()
returns trigger
language plpgsql
as $$
begin
  if old.fetched_at < now() - interval '2 hours' then
    raise exception 'Cannot delete daily_fx_rates older than 2 hours';
  end if;
  return old;
end;
$$;

create trigger fx_immutable_delete
before delete on public.daily_fx_rates
for each row execute function public.block_fx_delete();
