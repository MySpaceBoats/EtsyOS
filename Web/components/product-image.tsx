/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

// Plain <img>, not next/image: the Cloudflare Pages edge runtime has no Next.js
// image-optimization server, and the R2 URLs are already served through
// Cloudflare's CDN. images.unoptimized is set in next.config.mjs for the same
// reason. Below-the-fold images lazy-load.
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("object-cover", className)}
    />
  );
}
