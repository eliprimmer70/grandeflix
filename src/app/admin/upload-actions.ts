"use server";

import { requireAdmin } from "@/lib/content";
import {
  buildMediaPath,
  getPublicMediaUrl,
  MEDIA_BUCKET,
  MEDIA_LIMITS,
  type MediaKind,
} from "@/lib/media-upload";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type UploadPrepareResult =
  | {
      path: string;
      token: string;
      publicUrl: string;
    }
  | { error: string };

function validateServerMedia(kind: MediaKind, contentType: string, size: number): string | null {
  const limits = MEDIA_LIMITS[kind];
  if (!limits.mimes.has(contentType)) return "Invalid file type.";
  if (size > limits.maxBytes) return `File exceeds ${limits.label} limit.`;
  return null;
}

export async function prepareMediaUpload(input: {
  kind: MediaKind;
  filename: string;
  contentType: string;
  size: number;
  slug?: string;
}): Promise<UploadPrepareResult> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Unauthorized." };
  }

  const env = getSupabaseEnv();
  if (!env) return { error: "Supabase is not configured." };

  const service = createServiceRoleClient();
  if (!service) {
    return {
      error:
        "Uploads require SUPABASE_SERVICE_ROLE_KEY on the server. Add it in Vercel env vars (not NEXT_PUBLIC) and redeploy.",
    };
  }

  const validationError = validateServerMedia(input.kind, input.contentType, input.size);
  if (validationError) return { error: validationError };

  const path = buildMediaPath(input.kind, input.slug?.trim() || "draft", input.filename);
  const { data, error } = await service.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    return {
      error:
        error?.message ??
        "Could not create upload URL. Run supabase/storage.sql in the Supabase SQL Editor to create the media bucket.",
    };
  }

  return {
    path: data.path,
    token: data.token,
    publicUrl: getPublicMediaUrl(env.url, data.path),
  };
}
