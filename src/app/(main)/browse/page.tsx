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

  const hasRows = Boolean(comingSoonRow) || rows.length > 0;

  return (
    <PageFade>
      <div className="bg-background">
        <Hero featured={featured} />
        {hasRows ? (
          <div className="relative z-10 -mt-8 space-y-1 pb-16 safe-bottom sm:-mt-12 sm:space-y-2 md:-mt-16 lg:-mt-20 sm:pb-20">
            {comingSoonRow && <ContentRow row={comingSoonRow} hideCardBadges />}
            {rows.map((row) => (
              <ContentRow key={row.id} row={row} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No fan videos yet"
            description="Fan movies, tour videos, and edits will show up here once they're added."
            className="py-24"
          />
        )}
      </div>
    </PageFade>
  );
}
