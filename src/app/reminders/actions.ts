"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export type ReminderState = { error?: string; reminded?: boolean };

function formatReminderError(message: string): string {
  if (message.includes("content_reminders")) {
    return "Database is missing content_reminders. Run npm run db:reminders in Supabase SQL Editor, then try again.";
  }
  return message;
}

export async function toggleContentReminder(
  _prev: ReminderState,
  formData: FormData,
): Promise<ReminderState> {
  const contentId = String(formData.get("content_id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!contentId) return { error: "Missing content." };

  const user = await getSessionUser();
  if (!user) return { error: "Sign in to set reminders." };

  const supabase = await createClient();
  if (!supabase) return { error: "Service unavailable." };

  const { data: existing } = await supabase
    .from("content_reminders")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_id", contentId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("content_reminders")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: formatReminderError(error.message) };

    if (slug) {
      revalidatePath(`/watch/${slug}`);
      revalidatePath("/browse");
    }
    return { reminded: false };
  }

  const { error } = await supabase.from("content_reminders").insert({
    user_id: user.id,
    content_id: contentId,
  });
  if (error) return { error: formatReminderError(error.message) };

  if (slug) {
    revalidatePath(`/watch/${slug}`);
    revalidatePath("/browse");
  }
  return { reminded: true };
}
