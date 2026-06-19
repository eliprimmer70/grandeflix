import { NextResponse } from "next/server";
import { bootstrapAdminIfConfigured, ensureUserProfile } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/browse";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.exchangeCodeForSession(code);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await ensureUserProfile(supabase, user);
        await bootstrapAdminIfConfigured(user);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
