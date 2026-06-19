"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-xs uppercase tracking-widest text-white/35">Something went wrong</p>
      <h1 className="mt-3 font-display text-xl font-bold text-white">Couldn&apos;t load this page</h1>
      <p className="mt-2 max-w-md text-sm text-white/45">
        Try a hard refresh (Cmd+Shift+R). If it keeps happening, finish{" "}
        <Link href="/setup" className="text-brand-bright underline">
          database setup
        </Link>{" "}
        and confirm Vercel env vars are set.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-white/25">Error ID: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary rounded-lg px-5 py-2.5 text-sm">
          Try again
        </button>
        <Link href="/" className="btn-outline rounded-lg px-5 py-2.5 text-sm">
          Home
        </Link>
      </div>
    </div>
  );
}
