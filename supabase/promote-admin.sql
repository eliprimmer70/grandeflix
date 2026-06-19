-- Promote eli.primmer@gmail.com to admin (creates profile row if signup trigger missed)
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where lower(email) = lower('eli.primmer@gmail.com')
on conflict (id) do update set role = 'admin';

-- Verify:
-- select id, email, role from public.profiles where lower(email) = lower('eli.primmer@gmail.com');
