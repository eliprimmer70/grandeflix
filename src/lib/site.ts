import { siteConfig } from "@/data/content";

/** Canonical site URL — set NEXT_PUBLIC_SITE_URL on Vercel to https://grandeflix.com */
export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return fromEnv || siteConfig.url;
}

export function authCallbackUrl(next = "/browse") {
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}
