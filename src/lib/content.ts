import { createClient } from "@/lib/supabase/server";
import type { DbContent } from "@/lib/types";
import { mapContent, sanitizeSearchQuery } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";

export async function getSessionUser() {
  try {
    const supabase = await createClient();
    if (!supabase) return null;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: "unauthorized" | "forbidden" | "no_profile" | "misconfigured",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) return false;
  return data?.role === "admin";
}

export async function requireAdmin() {
  const supabase = await createClient();
  if (!supabase) throw new AuthError("Supabase is not configured.", "misconfigured");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError("Sign in required.", "unauthorized");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new AuthError("Could not load profile.", "forbidden");
  if (!profile) {
    throw new AuthError(
      "No profile found. Sign out and sign up again, or run promote-admin.sql in Supabase.",
      "no_profile",
    );
  }
  if (profile.role !== "admin") {
    throw new AuthError("Admin access required.", "forbidden");
  }
  return { supabase, user, profile };
}

async function fetchAllContent(): Promise<DbContent[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as DbContent[];
}

export async function getFeaturedContent() {
  const supabase = await createClient();
  if (!supabase) return null;
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
  if (!supabase) return null;
  const { data } = await supabase
    .from("content")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data ? mapContent(data as DbContent) : null;
}

export async function getAllSlugs() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase.from("content").select("slug");
  return (data ?? []).map((r) => r.slug as string);
}

export async function getRelatedContent(category: string, excludeId: string) {
  const supabase = await createClient();
  if (!supabase) return [];
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
  if (!supabase) return [];
  const { data } = await supabase
    .from("content")
    .select("*")
    .or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    .order("created_at", { ascending: false });

  return (data as DbContent[] | null)?.map(mapContent) ?? [];
}

export async function getAllContentAdmin() {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("content")
    .select("*")
    .order("created_at", { ascending: false });

  return (data as DbContent[] | null) ?? [];
}

export async function getContentByIdAdmin(id: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.from("content").select("*").eq("id", id).maybeSingle();
  return data as DbContent | null;
}
