-- Incremental migration: raise `media` bucket upload limit to 1 GB (idempotent)
-- Run in Supabase SQL Editor if the bucket already exists with a lower limit.
--
-- IMPORTANT: Supabase enforces a GLOBAL file size limit in
-- Dashboard → Storage → Settings → Global file size limit.
-- Free tier: global max is 50 MB (52428800 bytes) — this SQL cannot exceed that.
-- Pro+: raise the global limit first, then run this migration (or npm run db:storage-1gb:apply).

update storage.buckets
set file_size_limit = 1073741824 -- 1 GB
where id = 'media';

-- Verify:
--   select id, file_size_limit from storage.buckets where id = 'media';
-- Expected on Free: still 52428800 until Pro + global limit raised.
