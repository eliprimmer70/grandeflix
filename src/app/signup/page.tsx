import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { siteConfig } from "@/data/content";
import { WordmarkLink } from "@/components/ui/Wordmark";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="landing-bg absolute inset-0 opacity-70" />
      <div className="film-grain absolute inset-0" />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-[42%] flex-col justify-between border-r border-white/[0.06] bg-surface/40 p-10 backdrop-blur-sm lg:flex xl:p-14">
          <WordmarkLink size="md" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Join free</p>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-white xl:text-4xl">
              Free to watch. Free to join.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/45">
              {siteConfig.description} No payment required — ever.
            </p>
          </div>
          <p className="text-xs text-white/25">© {new Date().getFullYear()} {siteConfig.name}</p>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="px-5 py-5 lg:hidden">
            <WordmarkLink size="sm" />
          </header>
          <div className="flex flex-1 items-center justify-center px-4 pb-16 safe-bottom lg:px-10">
            <div className="w-full max-w-[400px]">
              <h2 className="font-display text-2xl font-bold text-white lg:text-3xl">Join free</h2>
              <p className="mt-2 text-sm text-white/45">Fan movies, tour videos, edits — all free to watch.</p>
              <div className="mt-8 rounded-2xl border border-white/[0.08] bg-surface/60 p-6 backdrop-blur-md sm:p-8">
                <Suspense>
                  <SignUpForm />
                </Suspense>
              </div>
              <p className="mt-6 text-center text-sm text-white/35">
                Already have an account?{" "}
                <Link href="/login" className="text-brand-bright hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
