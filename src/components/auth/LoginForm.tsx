"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "./SupabaseSetupNotice";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/browse";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!hasSupabaseEnv()) {
    return <SupabaseSetupNotice />;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      setError("Authentication is not configured.");
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs text-white/50">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input-field w-full rounded-lg px-3 py-2.5 text-base text-white"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs text-white/50">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="input-field w-full rounded-lg px-3 py-2.5 text-base text-white"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary min-h-[48px] w-full rounded-lg py-3 text-base disabled:opacity-50 sm:py-2.5 sm:text-sm"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-xs text-white/35">
        No profile yet?{" "}
        <Link href="/signup" className="text-brand-bright hover:underline">
          Join free
        </Link>
      </p>
    </form>
  );
}
