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

**Enforced limit:** Supabase applies the **lower** of (1) global Storage Settings limit, (2) bucket `file_size_limit`, and (3) app validation. On the **Free tier**, the global cap is **50 MB** — raising the bucket to 1 GB in SQL or via API will fail until you upgrade to **Pro** and increase **Storage → Settings → Global file size limit**. For large videos on Free, paste a **YouTube/Vimeo URL** or host the MP4 on **Cloudflare R2** (see below).

### Remind me (content_reminders)

If the base schema was applied before reminders were added, run **`supabase/migrate-content-reminders.sql`** in the SQL Editor (or `npm run db:reminders` to copy it). See also [grandeflix.com/setup#reminders](https://grandeflix.com/setup#reminders).

### Cloudflare R2 for large videos

Supabase Storage is fine for posters and short clips, but multi-GB fan films exceed the Free-tier upload cap. **Cloudflare R2** offers **10 GB free storage** with **no egress fees** — ideal for direct MP4 links played by the built-in HTML5 player.

#### Option A — Upload from admin (recommended)

Once R2 env vars are set in Vercel (see below), admins can use **Upload to Cloudflare R2** on `/admin` for video and trailer fields. Files are stored at `videos/{slug}/…`, `trailers/{slug}/…` and the public URL is saved automatically.

**One-command finish:** after browser setup, add `R2_*` vars to `.env`, then run `npm run r2:setup` — it pushes env vars to Vercel, applies CORS (if wrangler is logged in), and deploys production.

#### Option B — Manual upload + paste URL

1. **Create a bucket** in the [Cloudflare dashboard](https://dash.cloudflare.com/) → **R2** → **Create bucket** (name: `grandeflix-media`).
2. **Enable public access** — turn on the **r2.dev subdomain** for the bucket, or connect a **custom domain** under **Settings → Public access**. See [R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/).
3. **Create an API token** — **R2** → **Manage R2 API Tokens** → **Create API token** with **Object Read & Write** on your bucket. Save the Access Key ID and Secret Access Key.
4. **Upload your video** — drag the `.mp4` into the bucket, or use the admin R2 upload button.
5. **Paste in admin** — in **Video URL** (or **Trailer URL**) on `/admin`, paste the R2 URL and save.

The player treats `*.r2.dev` URLs, your custom R2 domain, and any direct `.mp4` / `.webm` / `.mov` link as native HTML5 video.

#### R2 environment variables (Vercel, server-only)

| Variable | Where to find it |
|----------|------------------|
| `R2_ACCOUNT_ID` | Cloudflare dashboard → any page → right sidebar **Account ID** |
| `R2_ACCESS_KEY_ID` | R2 → Manage R2 API Tokens → token you created |
| `R2_SECRET_ACCESS_KEY` | Shown once when creating the token |
| `R2_BUCKET_NAME` | Your bucket name: `grandeflix-media` |
| `R2_PUBLIC_URL` | Public bucket URL — e.g. `https://pub-xxxx.r2.dev` (no trailing slash) or `https://media.grandeflix.com` |

Add all five to **Vercel → Settings → Environment Variables** (Production + Preview), then **redeploy**. Never use `NEXT_PUBLIC_` for R2 secrets.

#### R2 bucket CORS (required for admin uploads)

Browser uploads use presigned PUT URLs. In the Cloudflare dashboard → your bucket → **Settings → CORS policy**, paste the JSON from **`scripts/r2-cors.json`** (allows `https://grandeflix.com` and `http://localhost:3000`). Or with Wrangler after login:

```bash
npm run r2:login          # optional — for CLI CORS
npm run r2:cors           # after wrangler login
npm run r2:setup          # after adding R2_* to .env — syncs Vercel + deploys
```

Or manually in the dashboard → bucket → **Settings → CORS policy**, paste **`scripts/r2-cors.json`**. With Wrangler:

```bash
npx wrangler r2 bucket cors put grandeflix-media --file scripts/r2-cors-wrangler.json
```

See [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/).

---

## Vercel environment variables (Production)

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://psicdsfgkqhjvqreroxj.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase **anon** JWT |
| `NEXT_PUBLIC_SITE_URL` | `https://grandeflix.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** JWT (admin uploads) |
| `R2_ACCOUNT_ID` | Cloudflare account ID (large video uploads) |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | `grandeflix-media` |
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
