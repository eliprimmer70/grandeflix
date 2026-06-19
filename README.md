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

### 3. Media storage (Cloudflare R2)

All admin uploads (posters, hero images, videos, trailers) go to **Cloudflare R2** — not Supabase Storage. Supabase is still used for **auth and the database only**.

**One-command finish:** after browser setup, add `R2_*` vars to `.env`, then run `npm run r2:setup` (or `npm run r2:finish` with `CLOUDFLARE_API_TOKEN`) — syncs Vercel, applies CORS, and deploys.

#### Upload from admin (recommended)

Once R2 env vars are set in Vercel, admins use **Upload to Cloudflare R2** on `/admin`. Files are stored at `thumbnails/{slug}/…`, `videos/{slug}/…`, `trailers/{slug}/…` and the public URL is saved automatically.

#### Manual upload + paste URL

1. **Create a bucket** in the [Cloudflare dashboard](https://dash.cloudflare.com/) → **R2** → **Create bucket** (name: `grandeflix`).
2. **Enable public access** — turn on the **r2.dev subdomain** for the bucket. See [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).
3. **Create an API token** — **R2** → **Manage R2 API Tokens** → **Object Read & Write** on your bucket.
4. **Upload** via admin or drag files into the bucket dashboard.
5. **Paste** the public URL in admin if not using the upload button.

The player treats `*.r2.dev` URLs, your custom R2 domain, and any direct `.mp4` / `.webm` / `.mov` link as native HTML5 video.

#### R2 environment variables (Vercel, server-only)

| Variable | Where to find it |
|----------|------------------|
| `R2_ACCOUNT_ID` | Cloudflare dashboard → right sidebar **Account ID** |
| `R2_ACCESS_KEY_ID` | R2 → Manage R2 API Tokens |
| `R2_SECRET_ACCESS_KEY` | Shown once when creating the token |
| `R2_BUCKET_NAME` | Your bucket name: `grandeflix` |
| `R2_PUBLIC_URL` | Public bucket URL — e.g. `https://pub-xxxx.r2.dev` (no trailing slash) |

Add all five to **Vercel → Settings → Environment Variables** (Production + Preview), then **redeploy**.

#### R2 bucket CORS (required for admin uploads)

Browser uploads use presigned PUT URLs. In bucket **Settings → CORS policy**, paste **`scripts/r2-cors.json`**. Or:

```bash
npm run r2:login
npm run r2:cors
npm run r2:finish   # needs CLOUDFLARE_API_TOKEN in .env
```

See [grandeflix.com/setup#r2](https://grandeflix.com/setup#r2) for the full checklist.

---

## Vercel environment variables (Production)

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://psicdsfgkqhjvqreroxj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase **anon** JWT |
| `NEXT_PUBLIC_SITE_URL` | `https://grandeflix.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** JWT (admin bootstrap) |
| `R2_ACCOUNT_ID` | Cloudflare account ID (all media uploads) |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | `grandeflix` |
| `R2_PUBLIC_URL` | Public bucket URL, e.g. `https://pub-xxxx.r2.dev` |

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
