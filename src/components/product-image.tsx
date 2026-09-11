import { useState } from "react";

import { safeImageUrl } from "@/lib/safe-url";
import { cn } from "@/lib/utils";

/**
 * Product imagery with a branded fallback.
 *
 * Product photography is served from the catalogue's own image URLs. If one
 * fails to load — or a product has no image at all — this renders a clean
 * Besjaar placeholder that keeps the card's aspect ratio, so a listing never
 * collapses or shows a broken-image icon.
 */
export function ProductImage({
  src,
  alt,
  className,
  sizes,
  priority = false,
  width = 800,
  height = 800,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  /** Set on the LCP image only; everything else stays lazy. */
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);

  // Image addresses arrive with the catalogue, from a supplier feed or a
  // channel import. An `<img>` will not run `javascript:`, but anything that is
  // not a plain http(s) or same-site address did not come from where it was
  // meant to, and the placeholder is a better answer than loading it. Every
  // image on the storefront and in the admin renders through this component,
  // so this is the one place the rule has to live.
  const source = safeImageUrl(src);

  if (!source || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-ice-100 text-primary/35",
          className,
        )}
        // An empty alt means the image is decorative, so the placeholder is
        // hidden from assistive tech rather than announced as an unnamed image.
        role={alt ? "img" : "presentation"}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        <svg viewBox="0 0 48 48" className="h-1/4 w-1/4 min-h-8 min-w-8" fill="none">
          <rect x="3" y="3" width="42" height="42" rx="12" className="fill-current opacity-25" />
          <path
            d="M17 13h9.1c4.2 0 6.7 2 6.7 5.4 0 2.3-1.2 3.8-3.2 4.6 2.5.6 4 2.4 4 5 0 3.7-2.7 6-7.2 6H17V13Z"
            className="fill-current"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={source}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-contain", className)}
    />
  );
}
