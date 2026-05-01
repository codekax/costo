-- Migration 0006 — auto-seed default categories on workspace creation
-- + auto-create personal workspace on user signup

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

-- Trigger: auto-add owner as member + seed categories on workspace insert
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

create trigger workspace_after_insert
after insert on public.workspaces
for each row execute function public.on_workspace_created();

-- Trigger: auto-create personal workspace on user signup
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

create trigger user_after_insert
after insert on auth.users
for each row execute function public.on_user_created();
