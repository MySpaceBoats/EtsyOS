"use client";

import { useState } from "react";
import { Monitor, Smartphone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { cn, formatPrice } from "@/lib/utils";
import type { Listing } from "@/lib/listings";

// A component styled to resemble an actual Etsy listing page so the reviewer
// sees roughly what a buyer would. Not pixel-perfect Etsy — a faithful mock.
export function EtsyPreview({ listing }: { listing: Listing }) {
  const [activeImage, setActiveImage] = useState(0);
  const [variant, setVariant] = useState<Record<string, string>>(() =>
    Object.fromEntries(listing.variants.map((v) => [v.name, v.options[0] ?? ""])),
  );
  const [mobile, setMobile] = useState(false);
  const gallery = listing.images.length ? listing.images : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-muted-foreground">Aperçu :</span>
        <Button
          size="sm"
          variant={mobile ? "outline" : "default"}
          onClick={() => setMobile(false)}
        >
          <Monitor /> Desktop
        </Button>
        <Button
          size="sm"
          variant={mobile ? "default" : "outline"}
          onClick={() => setMobile(true)}
        >
          <Smartphone /> Mobile
        </Button>
      </div>

      <div className="mx-auto rounded-lg border bg-white p-4 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100"
        style={{ maxWidth: mobile ? 400 : "100%" }}
      >
        <div className={cn("grid gap-6", mobile ? "grid-cols-1" : "md:grid-cols-2")}>
          {/* Gallery */}
          <div className="flex gap-3">
            {gallery.length > 1 && (
              <div className="flex flex-col gap-2">
                {gallery.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "h-14 w-14 overflow-hidden rounded border-2",
                      i === activeImage ? "border-primary" : "border-transparent",
                    )}
                  >
                    <ProductImage src={img} alt={`vue ${i + 1}`} className="h-full w-full" priority={i === 0} />
                  </button>
                ))}
              </div>
            )}
            <div className="aspect-square flex-1 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
              {gallery[activeImage] ? (
                <ProductImage
                  src={gallery[activeImage]}
                  alt={listing.title_etsy}
                  className="h-full w-full"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                  no image
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              {listing.store ?? "EtsyOS Shop"}
            </p>
            <h2 className="text-xl font-semibold leading-snug">{listing.title_etsy}</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatPrice(listing.price, listing.currency)}
              </span>
              {listing.quality_score != null && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {listing.quality_score.toFixed(1)}
                </span>
              )}
            </div>

            {listing.variants.map((v) => (
              <div key={v.name}>
                <p className="mb-1 text-sm font-medium">{v.name}</p>
                <div className="flex flex-wrap gap-2">
                  {v.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setVariant((s) => ({ ...s, [v.name]: opt }))}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm",
                        variant[v.name] === opt
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-300 dark:border-zinc-700",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button className="w-full cursor-default rounded-full bg-zinc-900 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
              Add to cart
            </button>

            <div className="space-y-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p className="whitespace-pre-line">{listing.description_long}</p>
            </div>

            {listing.tags.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-zinc-500">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {listing.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
