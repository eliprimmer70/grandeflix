"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMediaUploadLimits,
  getR2UploadStatus,
  prepareMediaUpload,
  prepareR2Upload,
} from "@/app/admin/upload-actions";
import {
  formatStorageError,
  getMediaUploadFixLinks,
  SUPABASE_FREE_TIER_MAX_BYTES,
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
  const supabaseInputRef = useRef<HTMLInputElement>(null);
  const r2InputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<"supabase" | "r2" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadLimit, setUploadLimit] = useState<MediaUploadLimit | null>(null);
  const [r2Status, setR2Status] = useState<{
    configured: boolean;
    maxLabel: string;
    setupMessage: string;
  } | null>(null);

  const supportsR2 = kind === "video" || kind === "trailer";
  const r2Configured = Boolean(r2Status?.configured);

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

    if (supportsR2) {
      void getR2UploadStatus()
        .then((status) => {
          if (!cancelled) setR2Status(status);
        })
        .catch(() => {
          /* optional */
        });
    }

    return () => {
      cancelled = true;
    };
  }, [kind, supportsR2]);

  async function uploadToSupabase(file: File) {
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
        }),
      );
      setMessage(null);
      return;
    }

    setUrl(prepared.publicUrl);
    setMessage("Upload complete (Supabase).");
  }

  async function uploadToR2(file: File) {
    const prepared = await prepareR2Upload({
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

    const response = await fetch(prepared.uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      setError(
        detail
          ? `R2 upload failed (${response.status}). Check bucket CORS allows PUT from this site. ${detail.slice(0, 120)}`
          : `R2 upload failed (${response.status}). Check bucket CORS allows PUT from https://grandeflix.com and http://localhost:3000.`,
      );
      setMessage(null);
      return;
    }

    setUrl(prepared.publicUrl);
    setMessage("Upload complete (Cloudflare R2).");
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    target: "supabase" | "r2",
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setMessage(null);

    if (target === "supabase") {
      const clientError = validateMediaFile(kind, file, uploadLimit?.bucketMaxBytes);
      if (clientError) {
        setError(clientError);
        return;
      }
      if (supportsR2 && r2Configured && file.size > SUPABASE_FREE_TIER_MAX_BYTES) {
        setError(
          `File is ${Math.round(file.size / (1024 * 1024))} MB — over the Supabase Free cap (50 MB). Use "Upload to Cloudflare R2" instead.`,
        );
        return;
      }
    }

    setUploading(true);
    setUploadTarget(target);
    setMessage(target === "r2" ? "Uploading to Cloudflare R2…" : "Uploading to Supabase…");

    try {
      if (target === "r2") {
        await uploadToR2(file);
      } else {
        await uploadToSupabase(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setMessage(null);
    } finally {
      setUploading(false);
      setUploadTarget(null);
    }
  }

  const accept =
    kind === "thumbnail"
      ? "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      : "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov";

  const maxLabel = uploadLimit?.label ?? "…";
  const limitHint = uploadLimit?.limitedByPlan
    ? `Supabase max ${maxLabel} on Free tier`
    : `Supabase max ${maxLabel}`;
  const fixLinks = uploadLimit ? getMediaUploadFixLinks(uploadLimit) : [];
  const showFixLinks = Boolean(error && fixLinks.length > 0);

  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs text-white/45">
        {label}
      </label>
      <input
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
            ref={supabaseInputRef}
            type="file"
            accept={accept}
            disabled={uploading}
            onChange={(e) => void handleFileChange(e, "supabase")}
            className="sr-only"
          />
          {uploading && uploadTarget === "supabase"
            ? "Uploading…"
            : supportsR2
              ? "Upload to Supabase (<50 MB)"
              : "Or upload from device"}
        </label>
        {supportsR2 && r2Configured && (
          <label className="cursor-pointer text-xs text-amber-200/90 hover:text-amber-100">
            <input
              ref={r2InputRef}
              type="file"
              accept={accept}
              disabled={uploading}
              onChange={(e) => void handleFileChange(e, "r2")}
              className="sr-only"
            />
            {uploading && uploadTarget === "r2"
              ? "Uploading to R2…"
              : `Upload to Cloudflare R2 (large files, max ${r2Status?.maxLabel ?? "10 GB"})`}
          </label>
        )}
        <span className="text-xs text-white/30">{limitHint}</span>
      </div>
      {message && !error && <p className="mt-1.5 text-xs text-emerald-400/80">{message}</p>}
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
      {showFixLinks && (
        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {fixLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-bright hover:underline"
            >
              {link.label} →
            </a>
          ))}
        </p>
      )}
      {supportsR2 && uploadLimit?.limitedByPlan && !error && (
        <p className="mt-1.5 text-xs text-amber-200/70">
          Supabase direct uploads are capped at {uploadLimit.label} on Free. For full-length films, use{" "}
          {r2Configured ? (
            <strong className="font-medium text-amber-100/90">Upload to Cloudflare R2</strong>
          ) : (
            <>
              <a
                href="https://developers.cloudflare.com/r2/buckets/public-buckets/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-bright hover:underline"
              >
                Cloudflare R2
              </a>{" "}
              (configure env vars — see README)
            </>
          )}{" "}
          or paste a YouTube/Vimeo/R2 public MP4 URL above.
        </p>
      )}
      {supportsR2 && !r2Configured && !uploadLimit?.limitedByPlan && (
        <p className="mt-1.5 text-xs text-white/30">
          For files over {Math.round(SUPABASE_FREE_TIER_MAX_BYTES / (1024 * 1024))} MB, configure Cloudflare
          R2 env vars (README) or paste a public R2 MP4 URL.
        </p>
      )}
    </div>
  );
}
