-- Coming soon flag + user reminders

alter table public.content
  add column if not exists coming_soon boolean not null default false;

create index if not exists content_coming_soon_idx
  on public.content (coming_soon)
  where coming_soon = true;

create table if not exists public.content_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  content_id uuid not null references public.content on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, content_id)
);

create index if not exists content_reminders_user_idx on public.content_reminders (user_id);
create index if not exists content_reminders_content_idx on public.content_reminders (content_id);

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
