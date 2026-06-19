import Link from "next/link";
import { supabaseSetup } from "@/data/setup";

export function SupabaseSetupNotice() {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100/90">
      <p className="font-medium text-white">Sign-up isn&apos;t ready yet</p>
      <p className="mt-2 text-white/60">
        Supabase env vars are missing on this deploy. Add them in Vercel, redeploy, then run the database
        SQL once.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/setup" className="btn-primary rounded-lg px-4 py-2 text-sm">
          Setup guide
        </Link>
        <a
          href={supabaseSetup.sqlEditorUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline rounded-lg px-4 py-2 text-sm"
        >
          Open SQL Editor
        </a>
      </div>
    </div>
  );
}
