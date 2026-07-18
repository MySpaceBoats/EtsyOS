import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ProductActions } from "@/components/product-actions";
import { ProductImage } from "@/components/product-image";
import { formatPrice } from "@/lib/utils";
import type { Listing } from "@/lib/listings";

export function ProductCard({ listing }: { listing: Listing }) {
  const main = listing.images[0];
  return (
    <Card className="flex flex-col overflow-hidden">
      <Link
        href={`/products/${listing.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {main ? (
          <ProductImage
            src={main}
            alt={listing.title_etsy}
            className="h-full w-full transition-transform hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            no image
          </div>
        )}
        <div className="absolute left-2 top-2">
          <StatusBadge status={listing.status} />
        </div>
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{listing.category}</span>
          <span className="font-semibold text-foreground">
            {formatPrice(listing.price, listing.currency)}
          </span>
        </div>
        <Link
          href={`/products/${listing.slug}`}
          className="line-clamp-2 text-sm font-medium hover:underline"
        >
          {listing.title_etsy}
        </Link>
        <div className="mt-auto pt-2">
          <ProductActions
            slug={listing.slug}
            status={listing.status}
            favorite={listing.favorite}
            variant="card"
          />
        </div>
      </CardContent>
    </Card>
  );
}
