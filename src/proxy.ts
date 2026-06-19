import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/browse", "/watch", "/search"];

function redirectTo(
  request: NextRequest,
  pathname: string,
  params?: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (!getSupabaseEnv()) {
      if (pathname.startsWith("/admin") || PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        return redirectTo(request, "/setup", { reason: "env" });
      }
      return NextResponse.next();
    }

    const { user, supabaseResponse } = await updateSession(request);

    const needsAuth = PROTECTED.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

    if (needsAuth && !user) {
      return redirectTo(request, "/", { signup: "1" });
    }

    if (pathname === "/" && user) {
      return redirectTo(request, "/browse");
    }

    if (pathname.startsWith("/admin") && !user) {
      return redirectTo(request, "/login", {
        redirect: pathname === "/admin/denied" ? "/admin" : pathname,
      });
    }

    return supabaseResponse;
  } catch (error) {
    console.error("[proxy]", error);
    return NextResponse.next();
  }
}

/**
 * Page navigations only — never intercept Next.js internals:
 * - /_next/* (static, flight, webpack-hmr, data)
 * - *.rsc and *.segment.rsc (RSC + segment prefetch)
 * - static assets in /public
 *
 * The previous catch-all matcher ran auth on those paths and broke client navigation.
 */
export const config = {
  matcher: [
    "/((?!_next/|.*\\.segments/|.*\\.rsc$|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
