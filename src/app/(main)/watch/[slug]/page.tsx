import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFade } from "@/components/motion/PageFade";
import { VideoPlayer } from "@/components/media/VideoPlayer";
import { ContentRow } from "@/components/media/ContentRow";
import { ReleaseBadge } from "@/components/ui/ReleaseBadge";
import { RemindMeButton } from "@/components/media/RemindMeButton";
import { getContentBySlug, getRelatedContent, getSessionUser, hasContentReminder } from "@/lib/content";
import { getPosterUrl, getVideoSource, getReleaseBadge, canPlay, isComingSoon } from "@/lib/utils";
import type { ContentRow as RowType } from "@/lib/types";

export const dynamic = "force-dynamic";

interface WatchPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ trailer?: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = await getContentBySlug(slug);
  if (!item) return { title: "Not found" };
  return { title: item.title, description: item.description };
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { slug } = await params;
  const { trailer: trailerParam } = await searchParams;
  const item = await getContentBySlug(slug);
  if (!item) notFound();

  const user = await getSessionUser();
  const reminded = user ? await hasContentReminder(user.id, item.id) : false;

  const badge = getReleaseBadge(
    item.releaseDate,
    item.videoUrl,
    item.comingSoon,
    item.releaseDateTba,
  );
  const released = canPlay(item.releaseDate, item.videoUrl, item.comingSoon, item.releaseDateTba);
  const preview = isComingSoon(item.releaseDate, item.videoUrl, item.comingSoon, item.releaseDateTba);
  const wantTrailer = trailerParam === "1" || (preview && item.trailerUrl);
  const playbackUrl =
    wantTrailer && item.trailerUrl
      ? item.trailerUrl
      : released && item.videoUrl
        ? item.videoUrl
        : null;
  const videoSource = playbackUrl ? getVideoSource(playbackUrl, true) : null;
  const posterUrl = getPosterUrl(item);

  const related = await getRelatedContent(item.category, item.id);
  const relatedRow: RowType | null =
    related.length > 0
      ? {
          id: "related",
          title: "More like this",
          category: item.category as RowType["category"],
          items: related,
        }
      : null;

  return (
    <PageFade>
      <div className="min-h-screen bg-background pb-16 safe-bottom pt-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4.25rem+env(safe-area-inset-top,0px))]">
        {videoSource ? (
          <VideoPlayer source={videoSource} title={item.title} />
        ) : (
          <div className="relative flex aspect-video items-center justify-center bg-surface">
            {posterUrl && (
              <Image src={posterUrl} alt="" fill className="object-cover opacity-20" sizes="100vw" />
            )}
            <div className="relative text-center">
              {badge && <ReleaseBadge badge={badge} />}
              <p className="mt-4 text-sm text-white/45">Not available yet.</p>
            </div>
          </div>
        )}

        <div className="page-x mx-auto max-w-3xl py-6 sm:py-8">
          {item.category && (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{item.category.replace(/-/g, " ")}</p>
          )}
          {badge && <div className="mt-2"><ReleaseBadge badge={badge} /></div>}
          <h1 className="mt-3 font-display text-2xl font-bold text-white md:text-3xl">{item.title}</h1>
          {item.releaseDateTba ? (
            <p className="mt-2 text-xs text-white/40">Release date not announced yet</p>
          ) : item.releaseDate ? (
            <p className="mt-2 text-xs text-white/40">
              Release: {new Date(item.releaseDate).toLocaleDateString("en-US", { dateStyle: "long" })}
            </p>
          ) : null}
          {item.description && (
            <p className="mt-5 text-[15px] leading-relaxed text-white/65">{item.description}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {released && item.videoUrl && (
              <Link href={`/watch/${item.slug}`} className="btn-watch min-h-[44px] rounded-lg px-5 py-2.5 text-sm">
                Watch now
              </Link>
            )}
            {item.trailerUrl && (
              <Link href={`/watch/${item.slug}?trailer=1`} className="btn-secondary min-h-[44px] rounded-lg px-5 py-2.5 text-sm">
                {preview ? "Watch trailer" : "Preview"}
              </Link>
            )}
            {preview && (
              <RemindMeButton
                contentId={item.id}
                slug={item.slug}
                initialReminded={reminded}
                signedIn={Boolean(user)}
              />
            )}
          </div>
        </div>

        {relatedRow && (
          <div className="pb-16">
            <ContentRow row={relatedRow} />
          </div>
        )}
      </div>
    </PageFade>
  );
}
