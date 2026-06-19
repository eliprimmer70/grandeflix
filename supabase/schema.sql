-- GRANDEFLIX — shared Supabase project
-- Uses existing auth.users + public.profiles (is_admin for CMS access)
-- Content lives in public.flix_content (see supabase/migrations/)

-- After first sign-up, promote admin:
-- update public.profiles set is_admin = true where email = 'eli.primmer@gmail.com';
