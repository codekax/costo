-- Migration 0003 — expenses + full-text search + auto-updated_at triggers

-- ============================================================================
-- shared updated_at trigger function
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

create trigger workspaces_set_updated
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger projects_set_updated
before update on public.projects
for each row execute function public.set_updated_at();

-- ============================================================================
-- expenses
-- ============================================================================

create type public.currency_code as enum ('ARS', 'USD');

create table public.expenses (
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

create index expenses_workspace_paid_idx on public.expenses(workspace_id, paid_at desc);
create index expenses_project_idx on public.expenses(project_id) where project_id is not null;
create index expenses_workspace_no_project_idx on public.expenses(workspace_id) where project_id is null;
create index expenses_category_idx on public.expenses(category_id);
create index expenses_vendor_idx on public.expenses(vendor_id) where vendor_id is not null;

-- Full-text search on description + notes
create index expenses_search_idx on public.expenses
  using gin (to_tsvector('spanish', coalesce(description, '') || ' ' || coalesce(notes, '')));

create trigger expenses_set_updated
before update on public.expenses
for each row execute function public.set_updated_at();

alter table public.expenses enable row level security;

create policy exp_all on public.expenses for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
