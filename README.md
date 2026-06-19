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

**Easiest:** open **[grandeflix.com/setup](https://grandeflix.com/setup)** (after deploy) or the [Supabase SQL Editor](https://supabase.com/dashboard/project/psicdsfgkqhjvqreroxj/sql/new) directly → copy SQL from the setup page → **Run**.

Or run locally: open **`supabase/schema.sql`** in the SQL Editor.

Or with CLI (after `supabase login` + `supabase link --project-ref psicdsfgkqhjvqreroxj`):

```bash
supabase db push
```

### 2. Admin access

Sign up at `/signup`, then run **`supabase/promote-admin.sql`** in the SQL Editor (or `npm run db:admin`):

```sql
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where lower(email) = lower('eli.primmer@gmail.com')
on conflict (id) do update set role = 'admin';
```

This creates the profile row if the signup trigger missed, then sets `role = 'admin'`.

**Optional (Vercel):** set `ADMIN_BOOTSTRAP_EMAIL` and `SUPABASE_SERVICE_ROLE_KEY` (server-only) to auto-promote that email on sign-in — no SQL step after the first deploy with those vars.

### 3. Storage (admin uploads)

Run **`supabase/storage.sql`** in the SQL Editor (or `npm run db:storage`) to create the public `media` bucket. Video and trailer uploads allow up to **1 GB** in the app.

If the bucket already exists with a lower limit, run **`supabase/migrate-storage-1gb.sql`** (or `npm run db:storage-1gb`).

To apply the bucket limit via API (requires Pro + raised global limit): `npm run db:storage-1gb:apply`. Check current limits: `npm run db:storage:check`.

**Enforced limit:** Supabase applies the **lower** of (1) global Storage Settings limit, (2) bucket `file_size_limit`, and (3) app validation. On the **Free tier**, the global cap is **50 MB** — raising the bucket to 1 GB in SQL or via API will fail until you upgrade to **Pro** and increase **Storage → Settings → Global file size limit**. For large videos on Free, paste a **YouTube/Vimeo URL** instead of uploading.

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

### Disable email confirmation (required)

GRANDEFLIX does **not** use email verification. In the Supabase dashboard:

1. **Authentication → Providers → Email** — turn **Confirm email** **OFF**
2. **Authentication → Rate Limits** — free tier caps signup/confirmation emails (~4/hour). If signup fails with *email rate limit exceeded*, wait an hour or confirm step 1 is disabled.

With confirmation off, `signUp` returns a session immediately and users go straight to `/browse`. See **[grandeflix.com/setup#auth](https://grandeflix.com/setup#auth)** for the full checklist.

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing (guests) |
| `/browse` | Library (signed in) |
| `/watch/[slug]` | Video / trailer |
| `/search` | Search |
| `/login` · `/signup` | Auth |
| `/setup` | One-click DB setup guide + SQL copy |
| `/admin` | CMS (admin only) |

## Content categories

Fan Movies, Fan Tour Videos, Featured Edits, Trending, New Releases
