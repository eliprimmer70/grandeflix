import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/browse", "/watch", "/search"];

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (!getSupabaseEnv()) {
      if (pathname.startsWith("/admin") || PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        const url = request.nextUrl.clone();
        url.pathname = "/setup";
        url.searchParams.set("reason", "env");
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    const { user, supabaseResponse } = await updateSession(request);

    const needsAuth = PROTECTED.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

    if (needsAuth && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("signup", "1");
      return NextResponse.redirect(url);
    }

    if (pathname === "/" && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/browse";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin") && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    console.error("[proxy]", error);
    return NextResponse.next();
  }
}

/** Only page routes — never intercept Next.js `/_next/*` (fixes client navigation errors) */
export const config = {
  matcher: [
    "/",
    "/browse",
    "/browse/:path*",
    "/watch/:path*",
    "/search",
    "/login",
    "/signup",
    "/setup",
    "/admin",
    "/admin/:path*",
    "/auth/callback",
  ],
};
