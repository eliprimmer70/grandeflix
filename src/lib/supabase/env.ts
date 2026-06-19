export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key || url.includes("placeholder") || key.includes("placeholder")) {
    return null;
  }
  return { url, key };
}

export function hasSupabaseEnv() {
  return getSupabaseEnv() !== null;
}
