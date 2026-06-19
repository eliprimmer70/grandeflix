"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { formatSignupError } from "@/lib/auth-errors";
import { ensureUserProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { SupabaseSetupNotice } from "./SupabaseSetupNotice";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submittingRef = useRef(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [showSetupLink, setShowSetupLink] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  if (!hasSupabaseEnv()) {
    return <SupabaseSetupNotice />;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || submittingRef.current) return;

    submittingRef.current = true;
    setLoading(true);
    setError("");
    setShowSetupLink(false);
    setMessage("");

    try {
      const form = new FormData(e.currentTarget);
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });

      if (authError) {
        const formatted = formatSignupError(authError.message);
        setError(formatted.text);
        setShowSetupLink(formatted.showSetupLink);
        return;
      }

      if (data.session?.user) {
        await ensureUserProfile(supabase, data.session.user);
        router.push("/browse");
        router.refresh();
        return;
      }

      setMessage("Account created. Check your email to confirm, then sign in.");
      setTimeout(() => router.push("/login"), 2000);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={loading}
          className="input-field w-full rounded-lg px-3 py-2.5 text-base text-white disabled:opacity-50"
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
          minLength={8}
          autoComplete="new-password"
          disabled={loading}
          className="input-field w-full rounded-lg px-3 py-2.5 text-base text-white disabled:opacity-50"
        />
      </div>
      {error && (
        <div className="space-y-2 text-sm text-red-400">
          <p>{error}</p>
          {showSetupLink && (
            <Link href="/setup#auth" className="inline-block text-brand-bright hover:underline">
              Supabase auth setup guide →
            </Link>
          )}
        </div>
      )}
      {message && <p className="text-sm text-emerald-400/90">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary min-h-[48px] w-full rounded-lg py-3 text-base disabled:opacity-50 sm:py-2.5 sm:text-sm"
      >
        {loading ? "Creating…" : "Join free"}
      </button>
      <p className="text-center text-xs text-white/35">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-bright hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
