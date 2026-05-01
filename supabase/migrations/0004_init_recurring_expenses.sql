-- Migration 0004 — recurring_expenses (scaffolding for v1.1)
-- Tabla creada pero sin lógica activa de materialización en MVP

create type public.recurrence_frequency as enum ('monthly', 'quarterly', 'yearly');

create table public.recurring_expenses (
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

create index rec_workspace_idx on public.recurring_expenses(workspace_id);
create index rec_due_idx on public.recurring_expenses(next_due_at) where paused_at is null;

alter table public.expenses
  add constraint expenses_recurring_fk
  foreign key (recurring_id) references public.recurring_expenses(id) on delete set null;

alter table public.recurring_expenses enable row level security;

create policy rec_all on public.recurring_expenses for all
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
