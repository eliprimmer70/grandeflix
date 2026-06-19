import type { Metadata } from "next";
import Link from "next/link";
import { WordmarkLink } from "@/components/ui/Wordmark";

export const metadata: Metadata = { title: "Admin access denied" };

export default async function AdminDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const noProfile = reason === "no_profile";

  return (
    <div className="relative min-h-screen bg-background">
      <div className="landing-bg absolute inset-0 opacity-70" />
      <div className="film-grain absolute inset-0" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 safe-top safe-bottom">
        <div className="w-full max-w-md text-center">
          <WordmarkLink size="sm" className="mx-auto mb-8 inline-flex" />
          <h1 className="font-display text-2xl font-bold text-white">Admin access required</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            {noProfile
              ? "Your account is signed in but has no profile row yet. Sign out and sign up again, or ask the site owner to run promote-admin.sql in Supabase."
              : "You are signed in, but this account does not have admin permissions. Contact the site owner if you need CMS access."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/browse" className="btn-primary rounded-lg px-5 py-2.5 text-sm">
              Back to browse
            </Link>
            <Link href="/login?redirect=/admin" className="btn-outline rounded-lg px-5 py-2.5 text-sm">
              Sign in as admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
