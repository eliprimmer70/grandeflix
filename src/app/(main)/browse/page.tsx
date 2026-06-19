import { PageFade } from "@/components/motion/PageFade";
import { Hero } from "@/components/home/Hero";
import { ContentRow } from "@/components/media/ContentRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { getFeaturedContent, getContentRows } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const [featured, rows] = await Promise.all([getFeaturedContent(), getContentRows()]);

  return (
    <PageFade>
      <div className="bg-background">
        <Hero featured={featured} />
        {rows.length > 0 ? (
          <div className="relative z-10 -mt-12 space-y-1 pb-16 safe-bottom sm:-mt-20 sm:space-y-2 sm:pb-20 md:-mt-36 lg:-mt-44">
            {rows.map((row) => (
              <ContentRow key={row.id} row={row} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No fan videos yet"
            description="Fan movies, tour videos, and edits will show up here once they're added."
            className="-mt-16 py-24"
          />
        )}
      </div>
    </PageFade>
  );
}
