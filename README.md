# GRANDEFLIX

Free fan-made cinema — fan movies, tour videos, edits, and more.

## Architecture (Vercel + Supabase)

| Layer | Service | Role |
|-------|---------|------|
| **Frontend + backend** | **Vercel** | Hosts Next.js. Server Actions, middleware, and `/auth/callback` run as serverless functions on Vercel — this *is* your backend. |
| **Auth + database** | **Supabase** | User accounts, sessions, `profiles` + `content` tables, row-level security |

You deploy the app to **Vercel**. Vercel runs your server code; Supabase stores data and handles login. No separate backend server to manage.

## Stack

- Next.js App Router · TypeScript · Tailwind CSS · Framer Motion
- **Vercel** — hosting + serverless API/backend
- **Supabase** — auth + Postgres
- Mobile-optimized for phones and tablets (responsive layout, touch scrolling, safe-area support)

## Local setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run **`supabase/schema.sql`** in the SQL Editor
3. Copy keys to `.env`:

```bash
cp .env.example .env
```

### 2. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Admin access

1. Sign up at `/signup` with `eli.primmer@gmail.com`
2. In Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'eli.primmer@gmail.com';
```

3. Sign in → **Admin** in nav → manage content at `/admin`

---

## Deploy to Vercel

### Prerequisites

- GitHub repo with this project pushed
- Supabase project with `schema.sql` already run
- `.env` values ready (see `.env.example`)

### Option A — GitHub (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** your repo
3. Vercel auto-detects Next.js — leave build settings as default → **Deploy**
4. After the first deploy, open **Project → Settings → Environment Variables** and add:

| Variable | Value | Environments |
|----------|--------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel URL, e.g. `https://grandeflix.vercel.app` | Production |

For preview deployments, you can also set `NEXT_PUBLIC_SITE_URL` to your production URL, or use Vercel’s preview URL per branch.

5. In **Supabase → Authentication → URL Configuration**:
   - **Site URL:** `https://your-domain.vercel.app`
   - **Redirect URLs:** add both:
     - `https://your-domain.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for local dev)

6. **Redeploy** after adding env vars: Deployments → ⋮ → Redeploy

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
cd /path/to/cinematic-stream
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel --prod
```

### Post-deploy checklist

- [ ] Landing page loads on phone without horizontal scroll
- [ ] Sign up / sign in works
- [ ] Email confirmation redirect hits `/auth/callback`
- [ ] `/browse` shows content rows (swipe horizontally on mobile)
- [ ] Admin can add content at `/admin`

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing (guests) |
| `/browse` | Main library (signed in) |
| `/watch/[slug]` | Video / trailer |
| `/search?q=` | Search |
| `/login` · `/signup` | Auth |
| `/admin` | CMS (admin only) |

## Admin content fields

- Title, description, thumbnail URL
- Video URL + trailer URL (YouTube/Vimeo)
- Release date → **COMING [DATE]** or **COMING SOON**
- Category rows: Fan Movies, Fan Tour Videos, Featured Edits, Trending, New Releases
- Featured → browse page hero
