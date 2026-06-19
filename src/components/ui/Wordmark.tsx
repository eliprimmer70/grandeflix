import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/data/content";

export function Wordmark({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const logoHeights = { sm: 28, md: 36, lg: 48 };
  const textSizes = {
    sm: "text-lg",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl md:text-4xl",
  };

  return (
    <span className={cn("inline-flex items-center gap-2 sm:gap-2.5", className)}>
      <Image
        src="/logo.png"
        alt=""
        width={logoHeights[size]}
        height={logoHeights[size]}
        className="h-auto w-auto shrink-0 object-contain"
        style={{ height: logoHeights[size], width: "auto" }}
        priority
      />
      <span className={cn("inline-flex items-baseline font-display tracking-tight", textSizes[size])}>
        <span className="font-semibold text-white">GRANDE</span>
        <span className="bg-gradient-to-r from-brand via-accent-red to-accent-blue bg-clip-text font-extrabold text-transparent">
          FLIX
        </span>
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
