-- ============================================================================
-- costo — Full DB setup
-- ============================================================================
-- Pegar este script entero en Supabase Dashboard → SQL Editor → Run.
-- Idempotente para los enums/buckets, pero las tablas se crean una sola vez:
-- si necesitás re-aplicarlo, primero corré supabase/teardown.sql.
--
-- Constitution v1.0.0 — workspace isolation + RLS day 1 + FX immutable.
-- ============================================================================


-- ============================================================================
-- 0001 — workspaces, members, invitations
-- ============================================================================

do $$ begin
  create type public.workspace_kind as enum ('personal', 'shared');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.workspace_role as enum ('owner', 'editor');
exception when duplicate_object then null; end $$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  kind public.workspace_kind not null,
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_idx on public.workspaces(owner_id);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);

create or replace function public.enforce_member_limit()
returns trigger
language plpgsql
as $$
declare
  member_count int;
begin
  select count(*) into member_count
  from public.workspace_members
  where workspace_id = new.workspace_id;

  if member_count >= 10 then
    raise exception 'Workspace member limit reached (max 10)';
  end if;
  return new;
end;
$$;

drop trigger if exists workspace_members_limit on public.workspace_members;
create trigger workspace_members_limit
before insert on public.workspace_members
for each row execute function public.enforce_member_limit();

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null,
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists invitations_pending_unique
  on public.invitations(workspace_id, email)
  where accepted_at is null;

create index if not exists invitations_token_idx
  on public.invitations(token) where accepted_at is null;
create index if not exists invitations_email_idx
  on public.invitations(email) where accepted_at is null;

-- Helper functions (defined AFTER the tables they read)
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role = 'owner'
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;

drop policy if exists ws_select on public.workspaces;
drop policy if exists ws_insert on public.workspaces;
drop policy if exists ws_update on public.workspaces;
drop policy if exists ws_delete on public.workspaces;
create policy ws_select on public.workspaces for select using (public.is_workspace_member(id));
create policy ws_insert on public.workspaces for insert with check (owner_id = auth.uid());
create policy ws_update on public.workspaces for update using (public.is_workspace_owner(id));
create policy ws_delete on public.workspaces for delete using (public.is_workspace_owner(id));

drop policy if exists wm_select on public.workspace_members;
drop policy if exists wm_insert on public.workspace_members;
drop policy if exists wm_update on public.workspace_members;
drop policy if exists wm_delete on public.workspace_members;
create policy wm_select on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));
create policy wm_insert on public.workspace_members for insert
  with check (public.is_workspace_owner(workspace_id) or user_id = auth.uid());
create policy wm_update on public.workspace_members for update
  using (public.is_workspace_owner(workspace_id));
create policy wm_delete on public.workspace_members for delete
  using (public.is_workspace_owner(workspace_id) or user_id = auth.uid());

drop policy if exists inv_select on public.invitations;
drop policy if exists inv_insert on public.invitations;
drop policy if exists inv_update on public.invitations;
drop policy if exists inv_delete on public.invitations;
create policy inv_select on public.invitations for select
  using (public.is_workspace_member(workspace_id));
create policy inv_insert on public.invitations for insert
  with check (public.is_workspace_owner(workspace_id));
create policy inv_update on public.invitations for update
  using (public.is_workspace_owner(workspace_id));
create policy inv_delete on public.invitations for delete
  using (public.is_workspace_owner(workspace_id));


-- ============================================================================
-- 0002 — projects, categories, vendors
-- ============================================================================

do $$ begin
  create type public.project_type as enum ('renovation', 'general', 'other');
exception when duplicate_object then null; end $$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  type public.project_type not null default 'general',
  description text,
  start_date date,
  end_date date,
  budget_ars numeric(14, 2),
  budget_usd numeric(14, 2),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index if not exists projects_workspace_idx
  on public.projects(workspace_id) where archived_at is null;
create index if not exists projects_archived_idx
  on public.projects(workspace_id, archived_at) where archived_at is not null;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  color text not null default '#6b7280',
  icon text not null default 'folder',
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create index if not exists categories_workspace_idx on public.categories(workspace_id);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  contact text,
  notes text,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create index if not exists vendors_workspace_idx on public.vendors(workspace_id);

alter table public.projects enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;

drop policy if exists proj_all on public.projects;
drop policy if exists cat_all on public.categories;
drop policy if exists ven_all on public.vendors;

create policy proj_all on public.projects for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy cat_all on public.categories for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy ven_all on public.vendors for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));


-- ============================================================================
-- 0003 — expenses + full-text search + auto-updated_at triggers
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workspaces_set_updated on public.workspaces;
create trigger workspaces_set_updated
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated on public.projects;
create trigger projects_set_updated
before update on public.projects
for each row execute function public.set_updated_at();

do $$ begin
  create type public.currency_code as enum ('ARS', 'USD');
exception when duplicate_object then null; end $$;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,

  amount numeric(14, 2) not null check (amount > 0),
  currency public.currency_code not null,
  fx_rate_used numeric(14, 6) not null check (fx_rate_used > 0),
  amount_ars numeric(14, 2) not null,
  amount_usd numeric(14, 2) not null,

  description text,
  notes text,
  paid_at date not null default current_date,

  attachment_url text,
  attachment_type text check (attachment_type in ('image', 'pdf') or attachment_type is null),

  recurring_id uuid,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_workspace_paid_idx
  on public.expenses(workspace_id, paid_at desc);
create index if not exists expenses_project_idx
  on public.expenses(project_id) where project_id is not null;
create index if not exists expenses_workspace_no_project_idx
  on public.expenses(workspace_id) where project_id is null;
create index if not exists expenses_category_idx on public.expenses(category_id);
create index if not exists expenses_vendor_idx
  on public.expenses(vendor_id) where vendor_id is not null;

create index if not exists expenses_search_idx on public.expenses
  using gin (to_tsvector('spanish', coalesce(description, '') || ' ' || coalesce(notes, '')));

drop trigger if exists expenses_set_updated on public.expenses;
create trigger expenses_set_updated
before update on public.expenses
for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;

drop policy if exists exp_all on public.expenses;
create policy exp_all on public.expenses for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));


-- ============================================================================
-- 0004 — recurring_expenses (scaffolding for v1.1)
-- ============================================================================

do $$ begin
  create type public.recurrence_frequency as enum ('monthly', 'quarterly', 'yearly');
exception when duplicate_object then null; end $$;

create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  currency public.currency_code not null,
  description text,
  frequency public.recurrence_frequency not null,
  next_due_at date not null,
  paused_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists rec_workspace_idx on public.recurring_expenses(workspace_id);
create index if not exists rec_due_idx
  on public.recurring_expenses(next_due_at) where paused_at is null;

do $$ begin
  alter table public.expenses
    add constraint expenses_recurring_fk
    foreign key (recurring_id) references public.recurring_expenses(id) on delete set null;
exception when duplicate_object then null; end $$;

alter table public.recurring_expenses enable row level security;

drop policy if exists rec_all on public.recurring_expenses;
create policy rec_all on public.recurring_expenses for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));


-- ============================================================================
-- 0005 — daily_fx_rates with immutability triggers
-- ============================================================================

create table if not exists public.daily_fx_rates (
  date date primary key,
  ars_per_usd_official numeric(14, 6) not null check (ars_per_usd_official > 0),
  source text not null default 'dolarapi.com',
  fetched_at timestamptz not null default now()
);

alter table public.daily_fx_rates enable row level security;

drop policy if exists fx_select on public.daily_fx_rates;
create policy fx_select on public.daily_fx_rates for select
  to authenticated
  using (true);

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

drop trigger if exists fx_immutable_update on public.daily_fx_rates;
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

drop trigger if exists fx_immutable_delete on public.daily_fx_rates;
create trigger fx_immutable_delete
before delete on public.daily_fx_rates
for each row execute function public.block_fx_delete();


-- ============================================================================
-- 0006 — auto-seed defaults + auto-create personal workspace on signup
-- ============================================================================

create or replace function public.seed_workspace_categories(ws_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (workspace_id, name, color, icon) values
    (ws_id, 'Materiales', '#f97316', 'package'),
    (ws_id, 'Mano de obra', '#3b82f6', 'hammer'),
    (ws_id, 'Servicios', '#22c55e', 'plug'),
    (ws_id, 'Impuestos', '#a855f7', 'receipt'),
    (ws_id, 'Comida', '#ef4444', 'utensils'),
    (ws_id, 'Transporte', '#14b8a6', 'car'),
    (ws_id, 'Herramientas', '#eab308', 'wrench'),
    (ws_id, 'Otros', '#6b7280', 'folder')
  on conflict do nothing;
end;
$$;

create or replace function public.on_workspace_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role, invited_by)
  values (new.id, new.owner_id, 'owner', new.owner_id)
  on conflict do nothing;

  perform public.seed_workspace_categories(new.id);
  return new;
end;
$$;

drop trigger if exists workspace_after_insert on public.workspaces;
create trigger workspace_after_insert
after insert on public.workspaces
for each row execute function public.on_workspace_created();

create or replace function public.on_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspaces (name, kind, owner_id)
  values ('Mi espacio', 'personal', new.id);
  return new;
end;
$$;

drop trigger if exists user_after_insert on auth.users;
create trigger user_after_insert
after insert on auth.users
for each row execute function public.on_user_created();


-- ============================================================================
-- 0007 — expense amount snapshot validation
-- ============================================================================

create or replace function public.validate_expense_amounts()
returns trigger
language plpgsql
as $$
declare
  expected_ars numeric(14, 2);
  expected_usd numeric(14, 2);
begin
  if new.currency = 'ARS' then
    expected_ars := new.amount;
    expected_usd := round(new.amount / new.fx_rate_used, 2);
  else
    expected_usd := new.amount;
    expected_ars := round(new.amount * new.fx_rate_used, 2);
  end if;

  if abs(new.amount_ars - expected_ars) > 0.02 then
    raise exception 'amount_ars (%) inconsistent with amount * fx_rate_used (%)',
      new.amount_ars, expected_ars;
  end if;
  if abs(new.amount_usd - expected_usd) > 0.02 then
    raise exception 'amount_usd (%) inconsistent with amount / fx_rate_used (%)',
      new.amount_usd, expected_usd;
  end if;

  return new;
end;
$$;

drop trigger if exists expenses_validate_amounts on public.expenses;
create trigger expenses_validate_amounts
before insert or update on public.expenses
for each row execute function public.validate_expense_amounts();


-- ============================================================================
-- 0008 — Storage bucket for expense attachments
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-attachments',
  'expense-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "expense_attach_select" on storage.objects;
drop policy if exists "expense_attach_insert" on storage.objects;
drop policy if exists "expense_attach_delete" on storage.objects;

create policy "expense_attach_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'expense-attachments'
  and public.is_workspace_member((storage.foldername(name))[1]::uuid)
);

create policy "expense_attach_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'expense-attachments'
  and public.is_workspace_member((storage.foldername(name))[1]::uuid)
);

create policy "expense_attach_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'expense-attachments'
  and public.is_workspace_member((storage.foldername(name))[1]::uuid)
);


-- ============================================================================
-- Seed: FX rate inicial de hoy (placeholder — el cron diario lo actualiza)
-- ============================================================================

insert into public.daily_fx_rates (date, ars_per_usd_official, source)
values (current_date, 1050, 'manual-seed')
on conflict (date) do nothing;


-- ============================================================================
-- Done.
-- ============================================================================
