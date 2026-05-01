-- Migration 0001 — workspaces, members, invitations
-- Constitution principles II (RLS day 1) + III (workspace isolation)

-- ============================================================================
-- workspaces
-- ============================================================================

create type public.workspace_kind as enum ('personal', 'shared');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  kind public.workspace_kind not null,
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspaces_owner_idx on public.workspaces(owner_id);

-- ============================================================================
-- workspace_members
-- ============================================================================

create type public.workspace_role as enum ('owner', 'editor');

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on public.workspace_members(user_id);

-- Hard cap: 10 members per workspace (constraint via trigger)
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

create trigger workspace_members_limit
before insert on public.workspace_members
for each row execute function public.enforce_member_limit();

-- ============================================================================
-- invitations
-- ============================================================================

create table public.invitations (
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

create unique index invitations_pending_unique
  on public.invitations(workspace_id, email)
  where accepted_at is null;

create index invitations_token_idx on public.invitations(token) where accepted_at is null;
create index invitations_email_idx on public.invitations(email) where accepted_at is null;

-- ============================================================================
-- Helper functions (used by RLS policies — defined AFTER tables they read)
-- ============================================================================

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

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;

-- workspaces
create policy ws_select on public.workspaces for select using (public.is_workspace_member(id));
create policy ws_insert on public.workspaces for insert with check (owner_id = auth.uid());
create policy ws_update on public.workspaces for update using (public.is_workspace_owner(id));
create policy ws_delete on public.workspaces for delete using (public.is_workspace_owner(id));

-- workspace_members
create policy wm_select on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));
create policy wm_insert on public.workspace_members for insert
  with check (public.is_workspace_owner(workspace_id) or user_id = auth.uid());
create policy wm_update on public.workspace_members for update
  using (public.is_workspace_owner(workspace_id));
create policy wm_delete on public.workspace_members for delete
  using (public.is_workspace_owner(workspace_id) or user_id = auth.uid());

-- invitations
create policy inv_select on public.invitations for select using (public.is_workspace_member(workspace_id));
create policy inv_insert on public.invitations for insert with check (public.is_workspace_owner(workspace_id));
create policy inv_update on public.invitations for update using (public.is_workspace_owner(workspace_id));
create policy inv_delete on public.invitations for delete using (public.is_workspace_owner(workspace_id));
