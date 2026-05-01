-- Migration 0008 — Storage bucket for expense attachments
-- Path convention: {workspace_id}/{expense_id}/{filename}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-attachments',
  'expense-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;

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
