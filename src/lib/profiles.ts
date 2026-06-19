import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient, getAdminBootstrapEmail } from "@/lib/supabase/admin";

export async function ensureUserProfile(supabase: SupabaseClient, user: User) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return;

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? "",
    role: "user",
  });

  // Trigger may have created the row between select and insert.
  if (error && error.code !== "23505") {
    console.error("[ensureUserProfile]", error.message);
  }
}

export async function bootstrapAdminIfConfigured(user: User) {
  const bootstrapEmail = getAdminBootstrapEmail();
  if (!bootstrapEmail || !user.email) return false;
  if (user.email.toLowerCase() !== bootstrapEmail) return false;

  const admin = createServiceRoleClient();
  if (!admin) return false;

  const { error } = await admin.from("profiles").upsert(
    { id: user.id, email: user.email, role: "admin" },
    { onConflict: "id" },
  );

  return !error;
}
