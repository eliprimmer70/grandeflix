"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/content";
import { slugify } from "@/lib/utils";

export type ContentFormState = { error?: string };

function parseDate(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function saveContent(
  _prev: ContentFormState,
  formData: FormData,
): Promise<ContentFormState> {
  let supabase;
  try {
    ({ supabase } = await requireAdmin());
  } catch {
    return { error: "Unauthorized." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const payload = {
    title,
    slug: slugify(String(formData.get("slug") || title)),
    description: String(formData.get("description") ?? "").trim(),
    poster_url: String(formData.get("poster_url") ?? "").trim() || null,
    thumbnail_url: String(formData.get("thumbnail_url") ?? "").trim() || null,
    video_url: String(formData.get("video_url") ?? "").trim() || null,
    trailer_url: String(formData.get("trailer_url") ?? "").trim() || null,
    release_date: parseDate(formData.get("release_date")),
    coming_soon: formData.get("coming_soon") === "on",
    category: String(formData.get("category") ?? "fan-movies"),
    featured: formData.get("featured") === "on",
  };

  const { error } = id
    ? await supabase.from("content").update(payload).eq("id", id)
    : await supabase.from("content").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/admin");
  revalidatePath("/search");
  redirect("/admin");
}

export async function deleteContent(id: string) {
  const { supabase } = await requireAdmin();
  await supabase.from("content").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/admin");
}

export async function signOutAction() {
  const supabase = await createClientForSignOut();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

async function createClientForSignOut() {
  const { createClient } = await import("@/lib/supabase/server");
  return createClient();
}
