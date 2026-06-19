"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveContent, type ContentFormState } from "@/app/admin/actions";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { CATEGORIES } from "@/lib/types";
import { formatDateInputValue, slugify } from "@/lib/utils";

type Initial = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  poster_url?: string;
  thumbnail_url?: string;
  video_url?: string;
  trailer_url?: string;
  release_date?: string;
  release_date_tba?: boolean;
  coming_soon?: boolean;
  category?: string;
  featured?: boolean;
};

export function ContentEditor({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ContentFormState, FormData>(
    saveContent,
    {},
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [releaseDateTba, setReleaseDateTba] = useState(initial?.release_date_tba ?? false);
  const slugHint = slug.trim() || slugify(title) || "draft";

  useEffect(() => {
    if (state.ok) router.replace("/admin");
  }, [state.ok, router]);

  return (
    <form action={formAction} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      {state.error && (
        <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <section className="space-y-4 rounded border border-white/[0.08] p-5">
        <h2 className="text-sm font-medium text-white/75">Details</h2>
        <Field
          label="Title"
          name="title"
          defaultValue={initial?.title}
          required
          onChange={(value) => setTitle(value)}
        />
        <Field
          label="Slug"
          name="slug"
          defaultValue={initial?.slug}
          placeholder="auto-from-title"
          onChange={(value) => setSlug(value)}
        />
        <div>
          <label className="mb-1.5 block text-xs text-white/45">Description</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={initial?.description}
            className="input-field w-full rounded px-3 py-2 text-sm text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-white/45">Category</label>
          <select
            name="category"
            defaultValue={initial?.category ?? "fan-movies"}
            className="input-field w-full rounded px-3 py-2 text-sm text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-[#111]">
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Release date"
          name="release_date"
          type="date"
          defaultValue={formatDateInputValue(initial?.release_date)}
          disabled={releaseDateTba}
        />
        <label className="flex items-center gap-2 text-sm text-white/65">
          <input
            type="checkbox"
            name="release_date_tba"
            checked={releaseDateTba}
            onChange={(e) => setReleaseDateTba(e.target.checked)}
          />
          Release date not announced yet (shows TBA badge instead of a date)
        </label>
        <p className="text-xs text-white/30">
          Future dates show as COMING [DATE]. Check TBA when the release date is unknown. Leave empty
          if already released.
        </p>
        <label className="flex items-center gap-2 text-sm text-white/65">
          <input type="checkbox" name="coming_soon" defaultChecked={initial?.coming_soon} />
          Mark as Coming Soon (shows badge + preview row even if video URL is set)
        </label>
        <label className="flex items-center gap-2 text-sm text-white/65">
          <input type="checkbox" name="featured" defaultChecked={initial?.featured} />
          Featured on homepage hero
        </label>
      </section>

      <section className="space-y-4 rounded border border-white/[0.08] p-5">
        <h2 className="text-sm font-medium text-white/75">Media</h2>
        <p className="text-xs text-white/35">
          Paste a YouTube/Vimeo URL, a{" "}
          <a
            href="https://developers.cloudflare.com/r2/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-bright hover:underline"
          >
            Cloudflare R2
          </a>{" "}
          public MP4 link (<code className="text-white/50">*.r2.dev</code> or custom domain), or upload
          MP4/WebM/MOV from your device (max 1 GB). Uploads require{" "}
          <code className="text-white/50">SUPABASE_SERVICE_ROLE_KEY</code> on the server.
        </p>
        <MediaUploadField
          label="Card image"
          name="poster_url"
          kind="thumbnail"
          defaultValue={initial?.poster_url}
          placeholder="https://… or upload JPG/PNG/WebP"
          slugHint={slugHint}
        />
        <p className="-mt-2 text-xs text-white/30">
          Shown on browse cards and the preview modal. Portrait or 16:9 works best.
        </p>
        <MediaUploadField
          label="Hero image (optional)"
          name="thumbnail_url"
          kind="thumbnail"
          defaultValue={initial?.thumbnail_url}
          placeholder="https://… or upload JPG/PNG/WebP"
          slugHint={slugHint}
        />
        <p className="-mt-2 text-xs text-white/30">
          Wide billboard for the featured hero. Falls back to the card image if empty.
        </p>
        <MediaUploadField
          label="Video URL (YouTube / Vimeo / R2 / file)"
          name="video_url"
          kind="video"
          defaultValue={initial?.video_url}
          placeholder="https://youtube.com/…, https://….r2.dev/…/video.mp4, or upload MP4"
          slugHint={slugHint}
        />
        <p className="-mt-2 text-xs text-white/30">
          For multi-GB films, upload to{" "}
          <a
            href="https://developers.cloudflare.com/r2/buckets/public-buckets/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-bright hover:underline"
          >
            Cloudflare R2
          </a>{" "}
          (10 GB free, no egress fees) and paste the public URL here.
        </p>
        <MediaUploadField
          label="Trailer URL (YouTube / Vimeo / R2 / file)"
          name="trailer_url"
          kind="trailer"
          defaultValue={initial?.trailer_url}
          placeholder="https://vimeo.com/…, https://….r2.dev/…/trailer.mp4, or upload MP4"
          slugHint={slugHint}
        />
      </section>

      <button
        type="submit"
        disabled={pending}
        className="btn-primary rounded px-8 py-2.5 text-sm disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  onChange,
  disabled,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs text-white/45">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="input-field w-full rounded px-3 py-2 text-sm text-white placeholder:text-white/20 disabled:cursor-not-allowed disabled:opacity-40"
      />
    </div>
  );
}
