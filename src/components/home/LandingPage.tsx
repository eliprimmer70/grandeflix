"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/data/content";
import { WordmarkLink } from "@/components/ui/Wordmark";
import Link from "next/link";

const HIGHLIGHTS = [
  {
    title: "Fan-made movies",
    text: "Full-length films and shorts crafted by fans — passion projects worth watching.",
  },
  {
    title: "Fan tour videos",
    text: "Tour footage, concert clips, and fan-captured moments from the road.",
  },
  {
    title: "Always free",
    text: "No paywalls, no fees. Sign up once and watch everything in the library.",
  },
];

export function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  function onGetStarted(e: FormEvent) {
    e.preventDefault();
    const q = email.trim() ? `?email=${encodeURIComponent(email.trim())}` : "";
    router.push(`/signup${q}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="landing-bg absolute inset-0" />
      <div className="film-grain absolute inset-0" />
      <div className="hero-billboard-fade absolute inset-0 opacity-80" />

      <header className="safe-top relative z-20 flex h-14 items-center justify-between px-4 sm:h-[72px] sm:px-10 lg:px-16">
        <WordmarkLink size="md" />
        <Link href="/login" className="btn-outline min-h-[44px] rounded-full px-4 py-2 text-sm sm:px-5">
          Sign In
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-6xl items-center gap-10 px-4 pb-16 pt-6 safe-bottom sm:min-h-[calc(100dvh-4.5rem)] sm:gap-12 sm:px-5 sm:pb-20 sm:pt-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="free-badge">100% free</span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              {siteConfig.tagline}
            </p>
          </div>
          <h1 className="font-display text-[1.75rem] font-bold leading-[1.12] text-white min-[400px]:text-3xl sm:text-4xl sm:leading-[1.08] lg:text-[3.5rem]">
            Fan-made films &amp; tour videos, all in one place.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/65 sm:mt-5 sm:text-base md:text-lg">
            {siteConfig.description} Sign up with your email to browse fan movies, tour videos,
            edits, and more — completely free.
          </p>

          <form onSubmit={onGetStarted} className="mt-8 max-w-md space-y-3">
            <label htmlFor="landing-email" className="block text-sm font-medium text-white/80">
              Join free with your email
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="landing-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                className="input-field min-h-[48px] flex-1 rounded-lg px-4 text-base text-white placeholder:text-white/35"
              />
              <button type="submit" className="btn-primary min-h-[48px] w-full rounded-lg px-6 text-base sm:w-auto sm:text-sm">
                Get started
              </button>
            </div>
          </form>

          <p className="mt-4 text-sm text-white/40">
            Already signed up?{" "}
            <Link href="/login" className="text-brand-bright underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:block"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-surface/80 p-8 backdrop-blur-sm">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-brand/15 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent-blue/20 blur-3xl" />
            <div className="relative space-y-6">
              {HIGHLIGHTS.map((item, i) => (
                <div key={item.title} className="flex gap-4 border-b border-white/[0.06] pb-6 last:border-0 last:pb-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/20 to-accent-blue/20 text-sm font-bold text-brand-bright">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/45">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 border-t border-white/[0.06] bg-surface/50 py-12 lg:hidden">
        <div className="mx-auto grid max-w-lg gap-8 px-5">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title}>
              <h3 className="font-display text-base font-semibold text-brand">{item.title}</h3>
              <p className="mt-1 text-sm text-white/45">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
