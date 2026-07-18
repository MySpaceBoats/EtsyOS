import { notFound } from "next/navigation";
import { getListing } from "@/lib/data";
import { ProductDetail } from "@/components/product-detail";

// Edge runtime is required for @cloudflare/next-on-pages (Workers runtime).
// Rendered on demand at the edge — the fiche is fetched from GitHub per request
// (cached ~30s in lib/github.ts), so no build-time data dependency.
export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();
  return <ProductDetail listing={listing.data} />;
}
