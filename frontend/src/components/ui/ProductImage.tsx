import { Package } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

// Section 3.5: product photos sit in a square ink-50 frame. Falls back to the package icon when there is no
// photo or it fails to load, so a broken image never shows.

const SIZES = {
  sm: "h-12 w-12 p-1",
  md: "h-20 w-20 p-1.5",
  lg: "h-40 w-40 p-3",
  fill: "aspect-square w-full p-2 sm:p-4",
} as const;

export interface ProductImageProps {
  src: string | null | undefined;
  /** Product name. Pass "" when the name is already shown right next to the photo. */
  alt: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function ProductImage({ src, alt, size = "md", className }: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && failedSrc !== src;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded bg-ink-50",
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <Package
          size={size === "sm" ? 20 : size === "md" ? 24 : 40}
          strokeWidth={1.75}
          className="text-ink-400"
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
        />
      )}
    </div>
  );
}
