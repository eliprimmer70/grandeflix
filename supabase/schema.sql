-- GRANDEFLIX — run via Supabase CLI or SQL Editor

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  thumbnail_url text,
  video_url text,
  trailer_url text,
  release_date timestamptz,
  coming_soon boolean not null default false,
  category text not null,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.content_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  content_id uuid not null references public.content on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, content_id)
);

create index if not exists content_coming_soon_idx on public.content (coming_soon) where coming_soon = true;
create index if not exists content_reminders_user_idx on public.content_reminders (user_id);
create index if not exists content_reminders_content_idx on public.content_reminders (content_id);

create index if not exists content_category_idx on public.content (category);
create index if not exists content_featured_idx on public.content (featured) where featured = true;
create index if not exists content_release_date_idx on public.content (release_date);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.content enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "content_select_public" on public.content;
create policy "content_select_public"
  on public.content for select
  using (true);

drop policy if exists "content_insert_admin" on public.content;
create policy "content_insert_admin"
  on public.content for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "content_update_admin" on public.content;
create policy "content_update_admin"
  on public.content for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "content_delete_admin" on public.content;
create policy "content_delete_admin"
  on public.content for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

alter table public.content_reminders enable row level security;

drop policy if exists "reminders_select_own" on public.content_reminders;
create policy "reminders_select_own"
  on public.content_reminders for select
  using (auth.uid() = user_id);

drop policy if exists "reminders_insert_own" on public.content_reminders;
create policy "reminders_insert_own"
  on public.content_reminders for insert
  with check (auth.uid() = user_id);

drop policy if exists "reminders_delete_own" on public.content_reminders;
create policy "reminders_delete_own"
  on public.content_reminders for delete
  using (auth.uid() = user_id);

-- After first sign-up, promote admin (see supabase/promote-admin.sql):
-- insert into public.profiles (id, email, role)
-- select id, email, 'admin' from auth.users
-- where lower(email) = lower('eli.primmer@gmail.com')
-- on conflict (id) do update set role = 'admin';

-- Storage bucket + policies for admin uploads: run supabase/storage.sql
