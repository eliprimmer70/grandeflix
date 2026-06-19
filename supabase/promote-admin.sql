-- Promote eli.primmer@gmail.com to admin (creates profile row if signup trigger missed)
-- NOTE: A plain UPDATE will affect 0 rows if no profile exists yet. Use this INSERT instead:
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where lower(email) = lower('eli.primmer@gmail.com')
on conflict (id) do update set role = 'admin';

-- Verify:
-- select id, email, role from public.profiles where lower(email) = lower('eli.primmer@gmail.com');
