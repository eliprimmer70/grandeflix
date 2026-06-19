import { createClient } from "@/lib/supabase/server";
import type { DbContent } from "@/lib/types";
import { mapContent, sanitizeSearchQuery } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

/** GRANDEFLIX content table (separate from the main app's tables) */
export const FLIX_CONTENT = "flix_content";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  return Boolean(data?.is_admin);
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Forbidden");
  return { supabase, user };
}

async function fetchAllContent(): Promise<DbContent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(FLIX_CONTENT)
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as DbContent[];
}

export async function getFeaturedContent() {
  const supabase = await createClient();
  const { data } = await supabase
    .from(FLIX_CONTENT)
    .select("*")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapContent(data as DbContent) : null;
}

export async function getContentRows() {
  const all = await fetchAllContent();
  const mapped = all.map(mapContent);

  return CATEGORIES.map((cat) => ({
    id: cat.value,
    title: cat.label,
    category: cat.value,
    items: mapped.filter((item) => item.category === cat.value),
  })).filter((row) => row.items.length > 0);
}

export async function getContentBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from(FLIX_CONTENT)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data ? mapContent(data as DbContent) : null;
}

export async function getAllSlugs() {
  const supabase = await createClient();
  const { data } = await supabase.from(FLIX_CONTENT).select("slug");
  return (data ?? []).map((r) => r.slug as string);
}

export async function getRelatedContent(category: string, excludeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from(FLIX_CONTENT)
    .select("*")
    .eq("category", category)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(12);

  return (data as DbContent[] | null)?.map(mapContent) ?? [];
}

export async function searchContent(query: string) {
  const q = query.trim();
  if (!q) return [];

  const safe = sanitizeSearchQuery(q);
  if (!safe) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from(FLIX_CONTENT)
    .select("*")
    .or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    .order("created_at", { ascending: false });

  return (data as DbContent[] | null)?.map(mapContent) ?? [];
}

export async function getAllContentAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from(FLIX_CONTENT)
    .select("*")
    .order("created_at", { ascending: false });

  return (data as DbContent[] | null) ?? [];
}

export async function getContentByIdAdmin(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from(FLIX_CONTENT).select("*").eq("id", id).maybeSingle();
  return data as DbContent | null;
}
