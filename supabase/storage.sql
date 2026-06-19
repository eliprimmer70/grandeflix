-- GRANDEFLIX Storage — run after schema.sql (Supabase SQL Editor or CLI)
-- Creates the public `media` bucket and admin-only write policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  524288000,
  array[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for published streaming assets
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read"
  on storage.objects for select
  using (bucket_id = 'media');

-- Admin upload (signed URL + authenticated admin session)
drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Folder layout (via app upload paths):
--   media/videos/{slug}/…
--   media/trailers/{slug}/…
--   media/thumbnails/{slug}/…
--
-- Verify after running:
--   select id, public, file_size_limit from storage.buckets where id = 'media';
