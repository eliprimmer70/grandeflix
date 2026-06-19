-- Incremental migration: separate card/poster image from hero billboard image
-- Run in Supabase SQL Editor if you see: "Could not find the 'poster_url' column of 'content'"

alter table public.content
  add column if not exists poster_url text;

-- Existing rows keep thumbnail_url as hero; cards fall back to thumbnail_url until poster_url is set.
