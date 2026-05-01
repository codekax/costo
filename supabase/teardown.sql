-- ============================================================================
-- TEARDOWN — borra TODO el schema costo del proyecto Supabase.
-- Útil si quedaste a medias y querés re-aplicar setup.sql desde cero.
--
-- ⚠️  DESTRUCTIVO: borra todos los datos. Solo usar en proyecto vacío / dev.
-- ============================================================================

-- Triggers en auth.users (creados en 0006)
drop trigger if exists user_after_insert on auth.users;
drop function if exists public.on_user_created() cascade;

-- Storage policies + bucket
drop policy if exists "expense_attach_select" on storage.objects;
drop policy if exists "expense_attach_insert" on storage.objects;
drop policy if exists "expense_attach_delete" on storage.objects;
delete from storage.objects where bucket_id = 'expense-attachments';
delete from storage.buckets where id = 'expense-attachments';

-- Tablas en orden de dependencia (cascade limpia FKs)
drop table if exists public.expenses cascade;
drop table if exists public.recurring_expenses cascade;
drop table if exists public.daily_fx_rates cascade;
drop table if exists public.vendors cascade;
drop table if exists public.categories cascade;
drop table if exists public.projects cascade;
drop table if exists public.invitations cascade;
drop table if exists public.workspace_members cascade;
drop table if exists public.workspaces cascade;

-- Funciones públicas
drop function if exists public.is_workspace_member(uuid) cascade;
drop function if exists public.is_workspace_owner(uuid) cascade;
drop function if exists public.enforce_member_limit() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.enforce_fx_immutability() cascade;
drop function if exists public.block_fx_delete() cascade;
drop function if exists public.seed_workspace_categories(uuid) cascade;
drop function if exists public.on_workspace_created() cascade;
drop function if exists public.validate_expense_amounts() cascade;

-- Tipos enum
drop type if exists public.workspace_kind cascade;
drop type if exists public.workspace_role cascade;
drop type if exists public.project_type cascade;
drop type if exists public.currency_code cascade;
drop type if exists public.recurrence_frequency cascade;
