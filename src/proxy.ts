import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, updateSession } from "@/lib/supabase/middleware";

const PROTECTED = ["/browse", "/watch", "/search"];

export async function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (!getSupabaseEnv()) {
      if (pathname.startsWith("/admin") || PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        return NextResponse.json(
          { error: "Server misconfigured: missing Supabase environment variables." },
          { status: 503 },
        );
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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
