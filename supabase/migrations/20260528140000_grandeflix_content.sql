-- GRANDEFLIX tables (shared Supabase project — uses existing auth.users + profiles)

create table if not exists public.flix_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  thumbnail_url text,
  video_url text,
  trailer_url text,
  release_date timestamptz,
  category text not null,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists flix_content_category_idx on public.flix_content (category);
create index if not exists flix_content_featured_idx on public.flix_content (featured) where featured = true;
create index if not exists flix_content_release_date_idx on public.flix_content (release_date);

alter table public.flix_content enable row level security;

drop policy if exists "flix_content_select_public" on public.flix_content;
create policy "flix_content_select_public"
  on public.flix_content for select
  using (true);

drop policy if exists "flix_content_insert_admin" on public.flix_content;
create policy "flix_content_insert_admin"
  on public.flix_content for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "flix_content_update_admin" on public.flix_content;
create policy "flix_content_update_admin"
  on public.flix_content for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "flix_content_delete_admin" on public.flix_content;
create policy "flix_content_delete_admin"
  on public.flix_content for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Promote admin after sign-up (uses existing profiles table):
-- update public.profiles set is_admin = true where email = 'eli.primmer@gmail.com';
