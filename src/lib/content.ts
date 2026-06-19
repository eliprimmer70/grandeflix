import { createClient } from "@/lib/supabase/server";
import type { DbContent, Profile, UserRole } from "@/lib/types";
import { mapContent, sanitizeSearchQuery } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  const profile = await getProfile(userId);
  return profile?.role ?? null;
}

export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
  return { supabase, user };
}

async function fetchAllContent(): Promise<DbContent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as DbContent[];
}

export async function getFeaturedContent() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content")
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
    .from("content")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data ? mapContent(data as DbContent) : null;
}

export async function getAllSlugs() {
  const supabase = await createClient();
  const { data } = await supabase.from("content").select("slug");
  return (data ?? []).map((r) => r.slug as string);
}

export async function getRelatedContent(category: string, excludeId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content")
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
    .from("content")
    .select("*")
    .or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    .order("created_at", { ascending: false });

  return (data as DbContent[] | null)?.map(mapContent) ?? [];
}

export async function getAllContentAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content")
    .select("*")
    .order("created_at", { ascending: false });

  return (data as DbContent[] | null) ?? [];
}

export async function getContentByIdAdmin(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("content").select("*").eq("id", id).maybeSingle();
  return data as DbContent | null;
}
