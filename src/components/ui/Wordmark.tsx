import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/data/content";

export function Wordmark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-xl",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl md:text-5xl",
  };

  return (
    <span className={cn("inline-flex items-baseline font-display tracking-tight", sizes[size], className)}>
      <span className="font-semibold text-white">GRANDE</span>
      <span className="bg-gradient-to-r from-brand to-accent-blue bg-clip-text font-extrabold text-transparent">
        FLIX
      </span>
    </span>
  );
}

export function WordmarkLink({ href = "/", className, size }: { href?: string; className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <Link href={href} className={cn("inline-block transition-opacity hover:opacity-90", className)}>
      <Wordmark size={size} />
      <span className="sr-only">{siteConfig.name}</span>
    </Link>
  );
}
