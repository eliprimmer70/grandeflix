-- Incremental migration: raise `media` bucket upload limit to 1 GB (idempotent)
-- Run in Supabase SQL Editor if the bucket already exists with a lower limit.
-- Note: Supabase Free tier may enforce a 50 MB global cap; Pro plan is typically
-- required for uploads larger than 50 MB on hosted projects.

update storage.buckets
set file_size_limit = 1073741824 -- 1 GB
where id = 'media';

-- Verify:
--   select id, file_size_limit from storage.buckets where id = 'media';
