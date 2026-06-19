import { PageFade } from "@/components/motion/PageFade";
import { Hero } from "@/components/home/Hero";
import { ContentRow } from "@/components/media/ContentRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFeaturedContent, getContentRows, getComingSoonContent } from "@/lib/content";
import type { ContentRow as RowType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const [featured, rows, comingSoon] = await Promise.all([
    getFeaturedContent(),
    getContentRows(),
    getComingSoonContent(),
  ]);

  const comingSoonRow: RowType | null =
    comingSoon.length > 0
      ? {
          id: "coming-soon",
          title: "Coming Soon",
          category: "new-releases",
          items: comingSoon,
        }
      : null;

  return (
    <PageFade>
      <div className="bg-background">
        <Hero featured={featured} />
        {comingSoonRow && (
          <div className="relative z-10 -mt-12 sm:-mt-20 md:-mt-36 lg:-mt-44">
            <ContentRow row={comingSoonRow} />
          </div>
        )}
        {rows.length > 0 ? (
          <div className={`relative z-10 space-y-1 pb-16 safe-bottom sm:space-y-2 sm:pb-20 ${comingSoonRow ? "" : "-mt-12 sm:-mt-20 md:-mt-36 lg:-mt-44"}`}>
            {rows.map((row) => (
              <ContentRow key={row.id} row={row} />
            ))}
          </div>
        ) : !comingSoonRow ? (
          <EmptyState
            title="No fan videos yet"
            description="Fan movies, tour videos, and edits will show up here once they're added."
            className="-mt-16 py-24"
          />
        ) : (
          <div className="pb-16 safe-bottom" />
        )}
      </div>
    </PageFade>
  );
}
