import { readFileSync } from "fs";
import { join } from "path";
import Link from "next/link";
import { supabaseSetup } from "@/data/setup";
import { SetupClient } from "./SetupClient";

export const metadata = { title: "Setup" };

function readSchema() {
  try {
    return readFileSync(join(process.cwd(), "supabase/schema.sql"), "utf8");
  } catch {
    return "-- Could not load schema.sql";
  }
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const schema = readSchema();

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
              4
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
