"use client";

import { useEffect, useRef, useState } from "react";
import {
  getMediaUploadLimits,
  getR2UploadStatus,
  prepareMediaUpload,
} from "@/app/admin/upload-actions";
import { validateMediaFile, type MediaKind, type MediaUploadLimit } from "@/lib/media-upload";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadLimit, setUploadLimit] = useState<MediaUploadLimit | null>(null);
  const [r2Configured, setR2Configured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    void getMediaUploadLimits()
      .then((result) => {
        if (cancelled) return;
        if ("error" in result) {
          setR2Configured(false);
          return;
        }
        setUploadLimit(result[kind]);
        setR2Configured(true);
      })
      .catch(() => {
        if (!cancelled) setR2Configured(false);
      });

    void getR2UploadStatus()
      .then((status) => {
        if (!cancelled) setR2Configured(status.configured);
      })
      .catch(() => {
        if (!cancelled) setR2Configured(false);
      });

    return () => {
      cancelled = true;
    };
  }, [kind]);

  async function uploadToR2(file: File) {
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

    const response = await fetch(prepared.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      setError(
        detail
          ? `Upload failed (${response.status}). Check R2 bucket CORS allows PUT from this site. ${detail.slice(0, 120)}`
          : `Upload failed (${response.status}). Check R2 bucket CORS allows PUT from https://grandeflix.com and http://localhost:3000.`,
      );
      setMessage(null);
      return;
    }

    setUrl(prepared.publicUrl);
    setMessage("Upload complete.");
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setMessage(null);

    const clientError = validateMediaFile(kind, file);
    if (clientError) {
      setError(clientError);
      return;
    }

    if (!r2Configured) {
      setError("Cloudflare R2 is not configured. See README or grandeflix.com/setup#r2.");
      return;
    }

    setUploading(true);
    setMessage("Uploading to Cloudflare R2…");

    try {
      await uploadToR2(file);
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
        <label
          className={`cursor-pointer text-xs ${r2Configured ? "text-brand hover:text-brand/80" : "text-white/30"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            disabled={uploading || r2Configured === false}
            onChange={(e) => void handleFileChange(e)}
            className="sr-only"
          />
          {uploading ? "Uploading…" : "Upload to Cloudflare R2"}
        </label>
        <span className="text-xs text-white/30">Max {maxLabel}</span>
      </div>
      {message && !error && <p className="mt-1.5 text-xs text-emerald-400/80">{message}</p>}
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
      {r2Configured === false && !error && (
        <p className="mt-1.5 text-xs text-amber-200/70">
          R2 env vars required for uploads —{" "}
          <a href="/setup#r2" className="text-brand-bright hover:underline">
            setup guide
          </a>
          . You can still paste a direct URL above.
        </p>
      )}
    </div>
  );
}
