-- Incremental migration: content_reminders (Remind me feature)
-- Run in Supabase SQL Editor if you see:
--   "Could not find the table 'public.content_reminders' in the schema cache"
-- Or run locally: npm run db:reminders

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
