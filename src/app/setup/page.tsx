import { readFileSync } from "fs";
import { join } from "path";
import Link from "next/link";
import { r2Setup, supabaseSetup } from "@/data/setup";
import { SetupClient } from "./SetupClient";

export const metadata = { title: "Setup" };

function readSchema() {
  try {
    return readFileSync(join(process.cwd(), "supabase/schema.sql"), "utf8");
  } catch {
    return "-- Could not load schema.sql";
  }
}

function readRemindersMigration() {
  try {
    return readFileSync(join(process.cwd(), "supabase/migrate-content-reminders.sql"), "utf8");
  } catch {
    return "-- Could not load migrate-content-reminders.sql";
  }
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const schema = readSchema();
  const remindersMigration = readRemindersMigration();

  return (
    <div className="min-h-screen bg-background px-4 py-10 safe-top safe-bottom sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="text-sm text-brand-bright hover:underline">
          ← Back to GRANDEFLIX
        </Link>

        <h1 className="mt-6 font-display text-2xl font-bold text-white sm:text-3xl">Database setup</h1>
        <p className="mt-2 text-sm text-white/55">
          One-time setup for your Supabase project. Takes about 30 seconds.
        </p>

        {reason === "env" && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
            Vercel is missing Supabase env vars. After running the SQL below, add{" "}
            <code className="text-white/80">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-white/80">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel → Settings →
            Environment Variables, then redeploy.
          </p>
        )}

        <ol className="mt-8 space-y-6 text-sm text-white/70">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-bright">
              1
            </span>
            <div>
              <p className="font-medium text-white">Open Supabase SQL Editor</p>
              <a
                href={supabaseSetup.sqlEditorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Open SQL Editor →
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-bright">
              2
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">Copy this SQL, paste in the editor, click Run</p>
              <SetupClient schema={schema} />
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-bright">
              3
            </span>
            <div id="auth">
              <p className="font-medium text-white">Disable email confirmation (required)</p>
              <p className="mt-1 text-xs text-white/40">
                GRANDEFLIX signs users in immediately — no verification email. If &quot;Confirm email&quot; is
                on, Supabase sends a confirmation on every signup and you will hit the free-tier email rate
                limit quickly.
              </p>
              <a
                href={supabaseSetup.emailProviderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-brand-bright hover:underline"
              >
                Supabase Email provider settings →
              </a>
              <p className="mt-2 text-white/45">
                Turn <strong className="text-white/70">off</strong>{" "}
                <code className="text-white/70">Confirm email</code> under Authentication → Providers →
                Email.
              </p>
              <p className="mt-3 text-xs text-white/40">
                Free tier rate limits (Authentication → Rate Limits): signup/confirmation emails are capped
                (~2 per hour).{" "}
                <a
                  href={supabaseSetup.rateLimitsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-bright hover:underline"
                >
                  View rate limits →
                </a>
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-bright">
              4
            </span>
            <div>
              <p className="font-medium text-white">Configure auth redirects</p>
              <a
                href={supabaseSetup.authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-brand-bright hover:underline"
              >
                Supabase Auth URL settings →
              </a>
              <p className="mt-2 text-white/45">
                Site URL: <code className="text-white/70">https://grandeflix.com</code>
                <br />
                Redirect: <code className="text-white/70">https://grandeflix.com/auth/callback</code>
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand-bright">
              5
            </span>
            <div>
              <p className="font-medium text-white">Make yourself admin (after signing up)</p>
              <p className="mt-1 text-xs text-white/40">
                Run <code className="text-white/55">supabase/promote-admin.sql</code> or paste below in SQL Editor.
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/60">
{`insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where lower(email) = lower('eli.primmer@gmail.com')
on conflict (id) do update set role = 'admin';`}
              </pre>
            </div>
          </li>
        </ol>

        <section id="reminders" className="mt-12 rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg font-semibold text-white">Remind me (content_reminders)</h2>
          <p className="mt-2 text-sm text-white/55">
            If you already ran the main schema but see{" "}
            <code className="text-white/70">Could not find the table &apos;public.content_reminders&apos;</code>{" "}
            when clicking <strong className="text-white/80">Remind me</strong>, run this incremental migration
            in the SQL Editor (or locally: <code className="text-white/55">npm run db:reminders</code>).
          </p>
          <SetupClient schema={remindersMigration} copyLabel="Copy reminders migration" />
        </section>

        <section id="r2" className="mt-12 rounded-xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-display text-lg font-semibold text-white">Cloudflare R2 (large videos)</h2>
          <p className="mt-2 text-sm text-white/55">
            Optional — enables <strong className="text-white/80">Upload to Cloudflare R2</strong> in
            admin for multi-GB fan films. Posters and short clips can stay on Supabase.
          </p>
          <ol className="mt-6 space-y-5 text-sm text-white/70">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-200">
                1
              </span>
              <div>
                <p className="font-medium text-white">Create an R2 bucket</p>
                <a
                  href={r2Setup.dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-600/80 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Open Cloudflare R2 →
                </a>
                <p className="mt-2 text-xs text-white/40">
                  Click <strong className="text-white/60">Create bucket</strong> → name it{" "}
                  <code className="text-white/55">{r2Setup.bucketName}</code> → Create.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-200">
                2
              </span>
              <div>
                <p className="font-medium text-white">Enable public access</p>
                <a
                  href={r2Setup.publicBucketsDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-brand-bright hover:underline"
                >
                  R2 public buckets docs →
                </a>
                <p className="mt-2 text-white/45">
                  Bucket → <strong className="text-white/70">Settings</strong> →{" "}
                  <strong className="text-white/70">Public access</strong> → enable{" "}
                  <code className="text-white/70">r2.dev</code> subdomain (or add a custom domain like{" "}
                  <code className="text-white/70">media.grandeflix.com</code>). Copy the public URL
                  base — e.g. <code className="text-white/70">https://pub-xxxx.r2.dev</code>.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-200">
                3
              </span>
              <div>
                <p className="font-medium text-white">Create an R2 API token</p>
                <a
                  href={r2Setup.apiTokensDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-brand-bright hover:underline"
                >
                  R2 API tokens docs →
                </a>
                <p className="mt-2 text-white/45">
                  R2 overview → <strong className="text-white/70">Manage R2 API Tokens</strong> →{" "}
                  <strong className="text-white/70">Create API token</strong> → permissions{" "}
                  <strong className="text-white/70">Object Read &amp; Write</strong> scoped to your
                  bucket. Save the Access Key ID and Secret Access Key (shown once).
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-200">
                4
              </span>
              <div>
                <p className="font-medium text-white">Set bucket CORS (required for admin uploads)</p>
                <a
                  href={r2Setup.corsDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-brand-bright hover:underline"
                >
                  R2 CORS docs →
                </a>
                <p className="mt-2 text-white/45">
                  Bucket → <strong className="text-white/70">Settings</strong> →{" "}
                  <strong className="text-white/70">CORS policy</strong> → paste JSON from{" "}
                  <code className="text-white/70">scripts/r2-cors.json</code> in the repo (or run{" "}
                  <code className="text-white/70">npm run r2:cors</code> after Wrangler login).
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-200">
                5
              </span>
              <div>
                <p className="font-medium text-white">Add env vars to Vercel and redeploy</p>
                <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/60">
{`R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=${r2Setup.bucketName}
R2_PUBLIC_URL=https://pub-xxxx.r2.dev`}
                </pre>
                <p className="mt-2 text-xs text-white/40">
                  Account ID is in the Cloudflare dashboard sidebar. Never prefix R2 secrets with{" "}
                  <code className="text-white/55">NEXT_PUBLIC_</code>.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/signup" className="btn-primary rounded-lg px-5 py-2.5 text-sm">
            Sign up
          </Link>
          <Link href="/" className="btn-outline rounded-lg px-5 py-2.5 text-sm">
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
