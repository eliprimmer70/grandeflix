import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 pt-16 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/30">
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-white/90">Not found</h1>
      <p className="mt-3 max-w-sm text-sm text-white/35">
        This page does not exist or the content has not been added yet.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-white/[0.12] bg-white/[0.04] px-8 py-3 text-sm font-medium text-white/70 transition-colors hover:border-white/[0.18] hover:text-white/90"
      >
        Return home
      </Link>
    </div>
  );
}
