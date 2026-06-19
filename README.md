# GRANDEFLIX

Free fan-made cinema — fan movies, tour videos, edits, and more.

**Production:** [https://grandeflix.com](https://grandeflix.com)

## Architecture (Vercel + Supabase)

| Layer | Service | Role |
|-------|---------|------|
| **Frontend + backend** | **Vercel** | Hosts Next.js at `grandeflix.com` |
| **Auth + database** | **Supabase** | Dedicated project `psicdsfgkqhjvqreroxj` |

## Local setup

```bash
cp .env.example .env
# Add your anon key to .env
npm install
npm run dev
```

### 1. Create database tables

In **Supabase → SQL Editor**, run the full contents of **`supabase/schema.sql`**.

Or with CLI (after `supabase login` + `supabase link --project-ref psicdsfgkqhjvqreroxj`):

```bash
supabase db push
```

### 2. Admin access

Sign up at `/signup`, then in SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'eli.primmer@gmail.com';
```

---

## Vercel environment variables (Production)

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://psicdsfgkqhjvqreroxj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase **anon** JWT |
| `NEXT_PUBLIC_SITE_URL` | `https://grandeflix.com` |

**Redeploy** after updating env vars.

## Supabase auth URLs

| Setting | Value |
|---------|--------|
| **Site URL** | `https://grandeflix.com` |
| **Redirect URLs** | `https://grandeflix.com/auth/callback` |
| | `http://localhost:3000/auth/callback` |

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing (guests) |
| `/browse` | Library (signed in) |
| `/watch/[slug]` | Video / trailer |
| `/search` | Search |
| `/login` · `/signup` | Auth |
| `/admin` | CMS (admin only) |

## Content categories

Fan Movies, Fan Tour Videos, Featured Edits, Trending, New Releases
