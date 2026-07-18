import { getAllListings } from "@/lib/data";
import { DashboardClient } from "@/components/dashboard-client";

// Edge runtime is required for @cloudflare/next-on-pages (Workers runtime).
export const runtime = "edge";
// Always render at request time so the console reflects live fiche state (the
// per-request GitHub reads are still cached ~30s in lib/github.ts).
export const dynamic = "force-dynamic";

export default async function Home() {
  const listings = await getAllListings();
  return <DashboardClient listings={listings.map((l) => l.data)} />;
}
