# Data Model — MVP Core

**Phase**: 1
**Date**: 2026-05-01

Schema completo de Postgres con RLS workspace-scoped, índices, triggers de inmutabilidad y seed function. Mapea 1:1 con las migrations en `supabase/migrations/`.

---

## Convenciones

- Todos los IDs son `uuid` con default `gen_random_uuid()`.
- Todos los `created_at` / `updated_at` son `timestamptz default now()`.
- Todos los montos son `numeric(14, 2)` (max 999.999.999.999,99).
- Tasas FX son `numeric(14, 6)`.
- `paid_at` es `date` (sin timezone — semántica date-only).
- Foreign keys con `ON DELETE CASCADE` salvo cuando se especifique.
- RLS habilitada en TODAS las tablas con datos de usuario.

## Helper functions (compartidas)

```sql
-- Returns true if the current user is a member of the workspace
create or replace function is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- Returns true if the current user is owner of the workspace
create or replace function is_workspace_owner(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role = 'owner'
  );
$$;
```

---

## Migration 0001 — workspaces, members, invitations

```sql
-- Workspaces
create type workspace_kind as enum ('personal', 'shared');

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  kind workspace_kind not null,
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspaces_owner_idx on workspaces(owner_id);

-- Workspace members
create type workspace_role as enum ('owner', 'editor');

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role workspace_role not null,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_idx on workspace_members(user_id);

-- Hard cap: 10 members per workspace (constraint via trigger)
create or replace function enforce_member_limit()
returns trigger
language plpgsql
as $$
declare
  member_count int;
begin
  select count(*) into member_count
  from workspace_members
  where workspace_id = new.workspace_id;

  if member_count >= 10 then
    raise exception 'Workspace member limit reached (max 10)';
  end if;
  return new;
end;
$$;

create trigger workspace_members_limit
before insert on workspace_members
for each row execute function enforce_member_limit();

-- Invitations
create table invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  email text not null,
  role workspace_role not null,
  token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (workspace_id, email, accepted_at)
);

create index invitations_token_idx on invitations(token) where accepted_at is null;
create index invitations_email_idx on invitations(email) where accepted_at is null;

-- RLS
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table invitations enable row level security;

-- workspaces: visible si soy member; editable si soy owner
create policy ws_select on workspaces for select using (is_workspace_member(id));
create policy ws_update on workspaces for update using (is_workspace_owner(id));
create policy ws_delete on workspaces for delete using (is_workspace_owner(id));
create policy ws_insert on workspaces for insert with check (owner_id = auth.uid());

-- workspace_members: visible si soy member del mismo workspace; mutable solo por owner
create policy wm_select on workspace_members for select
  using (is_workspace_member(workspace_id));
create policy wm_insert on workspace_members for insert
  with check (is_workspace_owner(workspace_id) or user_id = auth.uid());
create policy wm_update on workspace_members for update
  using (is_workspace_owner(workspace_id));
create policy wm_delete on workspace_members for delete
  using (is_workspace_owner(workspace_id) or user_id = auth.uid());

-- invitations: visible si soy member; mutable por owner
create policy inv_select on invitations for select using (is_workspace_member(workspace_id));
create policy inv_insert on invitations for insert with check (is_workspace_owner(workspace_id));
create policy inv_update on invitations for update using (is_workspace_owner(workspace_id));
create policy inv_delete on invitations for delete using (is_workspace_owner(workspace_id));
```

---

## Migration 0002 — projects, categories, vendors

```sql
create type project_type as enum ('renovation', 'general', 'other');

create table projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  type project_type not null default 'general',
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

create index projects_workspace_idx on projects(workspace_id) where archived_at is null;
create index projects_archived_idx on projects(workspace_id, archived_at) where archived_at is not null;

create table categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null check (length(name) between 1 and 60),
  color text not null default '#6b7280',
  icon text not null default 'folder',
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create index categories_workspace_idx on categories(workspace_id);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  contact text,
  notes text,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create index vendors_workspace_idx on vendors(workspace_id);

-- RLS
alter table projects enable row level security;
alter table categories enable row level security;
alter table vendors enable row level security;

create policy proj_all on projects for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy cat_all on categories for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));

create policy ven_all on vendors for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
```

---

## Migration 0003 — expenses

```sql
create type currency_code as enum ('ARS', 'USD');

create table expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,                -- null = Generales
  category_id uuid not null references categories(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,

  amount numeric(14, 2) not null check (amount > 0),
  currency currency_code not null,
  fx_rate_used numeric(14, 6) not null check (fx_rate_used > 0),
  amount_ars numeric(14, 2) not null,                                       -- denormalized snapshot
  amount_usd numeric(14, 2) not null,                                       -- denormalized snapshot

  description text,
  notes text,
  paid_at date not null default current_date,

  attachment_url text,
  attachment_type text check (attachment_type in ('image', 'pdf') or attachment_type is null),

  recurring_id uuid,                                                        -- v1.1, FK pendiente

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index expenses_workspace_paid_idx on expenses(workspace_id, paid_at desc);
create index expenses_project_idx on expenses(project_id) where project_id is not null;
create index expenses_workspace_no_project_idx on expenses(workspace_id) where project_id is null;
create index expenses_category_idx on expenses(category_id);
create index expenses_vendor_idx on expenses(vendor_id) where vendor_id is not null;

-- Full-text search on description + notes
create index expenses_search_idx on expenses
  using gin (to_tsvector('spanish', coalesce(description, '') || ' ' || coalesce(notes, '')));

-- Auto-update updated_at on UPDATE
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expenses_set_updated
before update on expenses
for each row execute function set_updated_at();

create trigger projects_set_updated
before update on projects
for each row execute function set_updated_at();

create trigger workspaces_set_updated
before update on workspaces
for each row execute function set_updated_at();

-- RLS
alter table expenses enable row level security;

create policy exp_all on expenses for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
```

---

## Migration 0004 — recurring_expenses (scaffolding v1.1)

```sql
create type recurrence_frequency as enum ('monthly', 'quarterly', 'yearly');

create table recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  currency currency_code not null,
  description text,
  frequency recurrence_frequency not null,
  next_due_at date not null,
  paused_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index rec_workspace_idx on recurring_expenses(workspace_id);
create index rec_due_idx on recurring_expenses(next_due_at) where paused_at is null;

-- Foreign key from expenses.recurring_id to recurring_expenses.id
alter table expenses
  add constraint expenses_recurring_fk
  foreign key (recurring_id) references recurring_expenses(id) on delete set null;

alter table recurring_expenses enable row level security;

create policy rec_all on recurring_expenses for all
  using (is_workspace_member(workspace_id))
  with check (is_workspace_member(workspace_id));
```

---

## Migration 0005 — daily_fx_rates

```sql
create table daily_fx_rates (
  date date primary key,
  ars_per_usd_official numeric(14, 6) not null check (ars_per_usd_official > 0),
  source text not null default 'dolarapi.com',
  fetched_at timestamptz not null default now()
);

-- RLS: read for any authenticated user, write only via service role
alter table daily_fx_rates enable row level security;

create policy fx_select on daily_fx_rates for select
  to authenticated
  using (true);

-- Immutability trigger: only allow UPDATE within 2h after fetched_at
create or replace function enforce_fx_immutability()
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
before update on daily_fx_rates
for each row execute function enforce_fx_immutability();

create or replace function block_fx_delete()
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
before delete on daily_fx_rates
for each row execute function block_fx_delete();
```

---

## Migration 0006 — seed_workspace_categories function

```sql
-- Seeds the 8 default categories on workspace creation
create or replace function seed_workspace_categories(ws_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  insert into categories (workspace_id, name, color, icon) values
    (ws_id, 'Materiales', '#f97316', 'package'),
    (ws_id, 'Mano de obra', '#3b82f6', 'hammer'),
    (ws_id, 'Servicios', '#22c55e', 'plug'),
    (ws_id, 'Impuestos', '#a855f7', 'receipt'),
    (ws_id, 'Comida', '#ef4444', 'utensils'),
    (ws_id, 'Transporte', '#14b8a6', 'car'),
    (ws_id, 'Herramientas', '#eab308', 'wrench'),
    (ws_id, 'Otros', '#6b7280', 'folder');
end;
$$;

-- Trigger: auto-seed on workspace insert + auto-add owner as member
create or replace function on_workspace_created()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into workspace_members (workspace_id, user_id, role, invited_by)
  values (new.id, new.owner_id, 'owner', new.owner_id)
  on conflict do nothing;

  perform seed_workspace_categories(new.id);
  return new;
end;
$$;

create trigger workspace_after_insert
after insert on workspaces
for each row execute function on_workspace_created();

-- Auto-create personal workspace on user signup
create or replace function on_user_created()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into workspaces (name, kind, owner_id)
  values ('Mi espacio', 'personal', new.id);
  return new;
end;
$$;

create trigger user_after_insert
after insert on auth.users
for each row execute function on_user_created();
```

---

## Migration 0007 — expense amount snapshot trigger

```sql
-- Validate amount_ars and amount_usd consistency with amount + currency + fx_rate_used
create or replace function validate_expense_amounts()
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
  else  -- USD
    expected_usd := new.amount;
    expected_ars := round(new.amount * new.fx_rate_used, 2);
  end if;

  -- Tolerate ±0.02 rounding drift
  if abs(new.amount_ars - expected_ars) > 0.02 then
    raise exception 'amount_ars (%) inconsistent with amount * fx_rate_used (%)', new.amount_ars, expected_ars;
  end if;
  if abs(new.amount_usd - expected_usd) > 0.02 then
    raise exception 'amount_usd (%) inconsistent with amount / fx_rate_used (%)', new.amount_usd, expected_usd;
  end if;
  return new;
end;
$$;

create trigger expenses_validate_amounts
before insert or update on expenses
for each row execute function validate_expense_amounts();
```

---

## Storage bucket

```sql
-- Bucket for expense attachments (images + PDFs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-attachments',
  'expense-attachments',
  false,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Storage RLS policies — only members can read/write their workspace folder
create policy "expense_attach_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'expense-attachments'
  and (
    select is_workspace_member((storage.foldername(name))[1]::uuid)
  )
);

create policy "expense_attach_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'expense-attachments'
  and (
    select is_workspace_member((storage.foldername(name))[1]::uuid)
  )
);

create policy "expense_attach_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'expense-attachments'
  and (
    select is_workspace_member((storage.foldername(name))[1]::uuid)
  )
);
```

Convención de paths: `{workspace_id}/{expense_id}/{filename}`.

---

## Relaciones — diagrama lógico

```
auth.users 1───* workspace_members *───1 workspaces
                                          │
                                          ├──* projects ──* expenses
                                          ├──* categories ──* expenses
                                          ├──* vendors ───* expenses
                                          ├──* invitations
                                          └──* recurring_expenses ──* expenses (v1.1)

daily_fx_rates  (global, no FK — snapshot copia el valor a expenses.fx_rate_used)
```

---

## State transitions

### Workspace
- `INSERT` → trigger crea owner member + seedea categorías
- `UPDATE name|kind` → permitido por owner
- `DELETE` → cascade a todo (members, invitations, projects, categories, vendors, expenses, recurring)

### Project
- `archived_at = null` → activo, aparece en dropdowns
- `archived_at = now()` → archivado, oculto en dropdowns, gastos siguen en totales globales
- `DELETE` → cascade a expenses

### Invitation
- `INSERT` → estado pendiente (`accepted_at = null`)
- `expires_at < now()` → expirada (lógica de app, no DB)
- `UPDATE accepted_at = now()` → consumida (terminal)
- `DELETE` → revocada

### Expense
- `INSERT` → snapshot calculado y validado por trigger
- `UPDATE amount|currency|fx_rate_used|amount_ars|amount_usd` → trigger re-valida coherencia
- Last-write-wins via `etag = updated_at` chequeado en Server Action
- `DELETE` → simple, cascade desde category/vendor/project/workspace

### Daily FX Rate
- `INSERT` → service role only (Edge Function)
- `UPDATE` → permitido solo dentro de 2h post `fetched_at`
- `DELETE` → idem

---

## Validation rules — resumen

| Tabla | Regla | Origen |
|---|---|---|
| `workspaces.name` | 1-80 chars | DB check + Zod |
| `workspace_members` | max 10 por workspace | DB trigger |
| `invitations.expires_at` | > now() al INSERT | Server Action |
| `projects.end_date` | >= `start_date` | DB check |
| `projects.budget_*` | NULL o > 0 | Zod (DB no chequea, podría ser 0 deliberado) |
| `categories.name` | unique per workspace | DB unique |
| `vendors.name` | unique per workspace | DB unique |
| `expenses.amount` | > 0 | DB check |
| `expenses.fx_rate_used` | > 0 | DB check |
| `expenses.amount_ars/usd` | coherente con amount + fx | DB trigger |
| `expenses.attachment_type` | image / pdf | DB check |
| `daily_fx_rates.ars_per_usd_official` | > 0 | DB check |
| `daily_fx_rates` (UPDATE/DELETE) | < 2h desde fetch | DB trigger |
