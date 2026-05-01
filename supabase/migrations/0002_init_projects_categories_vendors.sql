-- Migration 0002 — projects, categories, vendors

-- ============================================================================
-- projects
-- ============================================================================

create type public.project_type as enum ('renovation', 'general', 'other');

create table public.projects (
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

create index projects_workspace_idx on public.projects(workspace_id) where archived_at is null;
create index projects_archived_idx on public.projects(workspace_id, archived_at) where archived_at is not null;

-- ============================================================================
-- categories
-- ============================================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  color text not null default '#6b7280',
  icon text not null default 'folder',
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create index categories_workspace_idx on public.categories(workspace_id);

-- ============================================================================
-- vendors
-- ============================================================================

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  contact text,
  notes text,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create index vendors_workspace_idx on public.vendors(workspace_id);

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.projects enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;

create policy proj_all on public.projects for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy cat_all on public.categories for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy ven_all on public.vendors for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
