-- Incremental migration: poster_url + release_date_tba (safe to re-run)
-- Run in Supabase SQL Editor if save fails with missing column errors on admin edit.

alter table public.content
  add column if not exists poster_url text;

alter table public.content
  add column if not exists release_date_tba boolean not null default false;
