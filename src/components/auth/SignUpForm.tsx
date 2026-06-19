"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get("email");
    if (prefill) setEmail(prefill);
  }, [searchParams]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/browse`,
      },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setMessage("Account created. Check your email to confirm, then sign in.");
    setTimeout(() => router.push("/login"), 2000);
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
          minLength={8}
          autoComplete="new-password"
          className="input-field w-full rounded-lg px-3 py-2.5 text-base text-white"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
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
