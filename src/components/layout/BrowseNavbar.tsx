"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { WordmarkLink } from "@/components/ui/Wordmark";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/browse" },
  { label: "Fan Movies", href: "/browse#fan-movies" },
  { label: "Tour Videos", href: "/browse#fan-tour-videos" },
  { label: "Edits", href: "/browse#featured-edits" },
  { label: "New", href: "/browse#new-releases" },
];

export function BrowseNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initial, setInitial] = useState("");

  const onBrowse = pathname.startsWith("/browse");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setInitial((user.email?.[0] ?? "G").toUpperCase());
      const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      setIsAdmin(Boolean(data?.is_admin));
    });
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || !onBrowse
          ? "border-b border-white/[0.06] bg-[var(--nav-scrolled)] backdrop-blur-xl"
          : "bg-gradient-to-b from-black/70 via-black/30 to-transparent",
      )}
    >
      <div className="safe-top">
        <div className="mx-auto flex h-14 max-w-[1920px] items-center gap-3 px-4 sm:h-[68px] sm:gap-8 sm:px-10 lg:px-14">
          <WordmarkLink href="/browse" size="sm" />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ label, href }) => {
              const active = label === "Home" && pathname.startsWith("/browse");
              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    "relative px-3 py-1.5 text-[13px] transition-colors",
                    active ? "font-medium text-white" : "text-white/55 hover:text-white/85",
                  )}
                >
                  {label}
                  {active && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-brand to-accent-blue" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link
              href="/search"
              className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Search"
            >
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </Link>
            {isAdmin && (
              <Link href="/admin" className="hidden text-[13px] text-white/50 transition hover:text-brand sm:inline">
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={signOut}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-xs font-bold text-brand-bright transition hover:border-accent-blue/40 hover:bg-accent-blue/10"
              aria-label="Sign out"
              title="Sign out"
            >
              {initial || "·"}
            </button>
          </div>
        </div>

        {onBrowse && (
          <nav
            aria-label="Browse categories"
            className="touch-scroll flex gap-1 overflow-x-auto border-t border-white/[0.06] px-3 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="shrink-0 rounded-full border border-white/10 px-3.5 py-2 text-xs font-medium text-white/70 transition active:bg-white/10"
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
