"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMediaUploadLimits,
  prepareMediaUpload,
} from "@/app/admin/upload-actions";
import {
  formatStorageError,
  validateMediaFile,
  type MediaKind,
  type MediaUploadLimit,
} from "@/lib/media-upload";
import { createClient } from "@/lib/supabase/client";

type Props = {
  label: string;
  name: string;
  kind: MediaKind;
  defaultValue?: string;
  placeholder?: string;
  slugHint?: string;
};

export function MediaUploadField({
  label,
  name,
  kind,
  defaultValue,
  placeholder,
  slugHint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadLimit, setUploadLimit] = useState<MediaUploadLimit | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getMediaUploadLimits()
      .then((result) => {
        if (cancelled || "error" in result) return;
        setUploadLimit(result[kind]);
      })
      .catch(() => {
        /* limits are optional; static fallbacks apply */
      });

    return () => {
      cancelled = true;
    };
  }, [kind]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setMessage(null);

    const clientError = validateMediaFile(kind, file, uploadLimit?.bucketMaxBytes);
    if (clientError) {
      setError(clientError);
      return;
    }

    setUploading(true);
    setMessage("Uploading…");

    try {
      const prepared = await prepareMediaUpload({
        kind,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        slug: slugHint,
      });

      if ("error" in prepared) {
        setError(prepared.error);
        setMessage(null);
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        setError("Supabase client is not configured.");
        setMessage(null);
        return;
      }

      const { error: uploadError } = await supabase.storage
        .from("media")
        .uploadToSignedUrl(prepared.path, prepared.token, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        setError(
          formatStorageError(uploadError.message, {
            kind,
            bucketFileSizeLimit: uploadLimit?.bucketMaxBytes,
          })
        );
        setMessage(null);
        return;
      }

      setUrl(prepared.publicUrl);
      setMessage("Upload complete.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setMessage(null);
    } finally {
      setUploading(false);
    }
  }

  const accept =
    kind === "thumbnail"
      ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      : "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

  const maxLabel = uploadLimit?.label ?? "…";
  const limitHint = uploadLimit?.limitedByPlan
    ? `Max ${maxLabel} on Free tier — Pro or YouTube/Vimeo for larger files`
    : `Max ${maxLabel}`;

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs text-white/45">
        {label}
      </label>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        className="input-field w-full rounded px-3 py-2 text-sm text-white placeholder:text-white/20"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer text-xs text-brand hover:text-brand/80">
          <input
            type="file"
            accept={accept}
            disabled={uploading}
            onChange={handleFileChange}
            className="sr-only"
          />
          {uploading ? "Uploading…" : "Or upload from device"}
        </label>
        <span className="text-xs text-white/30">{limitHint}</span>
      </div>
      {message && !error && <p className="mt-1.5 text-xs text-emerald-400/80">{message}</p>}
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  );
}
