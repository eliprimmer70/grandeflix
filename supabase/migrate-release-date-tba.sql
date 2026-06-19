-- Incremental migration: release date TBA flag for coming-soon content without a date
-- Run in Supabase SQL Editor if you see: "Could not find the 'release_date_tba' column of 'content'"

alter table public.content
  add column if not exists release_date_tba boolean not null default false;
