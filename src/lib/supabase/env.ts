function clean(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  // Vercel dashboard sometimes saves empty values as literal quote characters
  if (trimmed === '""' || trimmed === "''") return "";
  return trimmed;
}

function isValidSupabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function isValidAnonKey(key: string) {
  if (key.includes("placeholder") || key.includes("your-anon")) return false;
  // Legacy JWT anon key (expected) or newer publishable key format
  return key.startsWith("eyJ") || key.startsWith("sb_publishable_");
}

export function getSupabaseEnv() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!isValidSupabaseUrl(url) || !isValidAnonKey(key)) {
    return null;
  }
  return { url, key };
}

export function hasSupabaseEnv() {
  return getSupabaseEnv() !== null;
}
