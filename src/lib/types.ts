export type UserRole = "user" | "admin";

export type ContentCategory =
  | "fan-movies"
  | "fan-tour-videos"
  | "featured-edits"
  | "trending"
  | "new-releases";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface DbContent {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string | null;
  poster_url: string | null;
  video_url: string | null;
  trailer_url: string | null;
  release_date: string | null;
  coming_soon: boolean;
  category: string;
  featured: boolean;
  created_at: string;
}

export interface ContentItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  posterUrl?: string;
  videoUrl?: string;
  trailerUrl?: string;
  releaseDate: string | null;
  comingSoon: boolean;
  category: string;
  featured: boolean;
  createdAt: string;
}

export interface ContentRow {
  id: string;
  title: string;
  category: ContentCategory;
  items: ContentItem[];
}

export interface ReleaseBadge {
  label: string;
  variant: "soon" | "dated";
}

export const CATEGORIES: { value: ContentCategory; label: string }[] = [
  { value: "fan-movies", label: "Fan Movies" },
  { value: "fan-tour-videos", label: "Fan Tour Videos" },
  { value: "featured-edits", label: "Featured Edits" },
  { value: "trending", label: "Trending" },
  { value: "new-releases", label: "New Releases" },
];
