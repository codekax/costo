-- Migration 0009 — project.type from enum to free-text
-- Lets users define their own project taxonomy per workspace.

-- 1. Drop the column DEFAULT (it references the enum type)
alter table public.projects alter column type drop default;

-- 2. Convert the column from enum to text
alter table public.projects alter column type type text using type::text;

-- 3. Re-establish a sensible default
alter table public.projects alter column type set default 'General';

-- 4. Drop the now-unused enum
drop type if exists public.project_type;

-- 5. Sanity bounds via check constraint
alter table public.projects
  add constraint projects_type_length check (length(type) between 1 and 60);
