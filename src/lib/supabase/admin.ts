import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

function clean(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed === '""' || trimmed === "''") return "";
  return trimmed;
}

export function getAdminBootstrapEmail() {
  return clean(process.env.ADMIN_BOOTSTRAP_EMAIL).toLowerCase();
}

export function createServiceRoleClient() {
  const env = getSupabaseEnv();
  const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!env || !serviceKey || serviceKey.includes("placeholder")) return null;
  return createSupabaseClient(env.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
