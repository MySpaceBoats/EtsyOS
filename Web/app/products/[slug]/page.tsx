import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/data";
import { getProduct, getWorkflows } from "@/lib/state";
import { ProductDetail } from "@/components/product-detail";
import { JsonInspector, SimpleTable, StatusBadge, SourceTag, fmtDate } from "@/components/control/primitives";
import { WorkflowGraph } from "@/components/control/workflow-graph";

// Edge runtime is required for @cloudflare/next-on-pages (Workers runtime).
// Rendered on demand at the edge — the fiche is fetched from GitHub per request
// (cached ~30s in lib/github.ts), so no build-time data dependency.
export const runtime = "edge";
export const dynamic = "force-dynamic";

// Product Inspector : la fiche (vue validation historique, inchangée) + tout
// ce que la pipeline sait du produit — Product Object section par section,
// historique, workflows associés avec logs.
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [listing, product, workflows] = await Promise.all([
    getListing(slug),
    getProduct(slug).catch(() => null),
    getWorkflows().catch(() => []),
  ]);
  if (!listing) notFound();
  const productWorkflows = workflows.filter((w) => w.slug === slug);

  return (
    <>
      <ProductDetail listing={listing.data} />

      {product ? (
        <section className="mx-auto mt-8 max-w-5xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Pipeline — Product Object</h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{product.id}</span>
              <span>étape : {product.stage ?? "—"}</span>
              <span>maj {fmtDate(product.updatedAt)}</span>
            </div>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Trend", product.trend, `/trends`],
                ["Market", product.market, `/market`],
                ["Opportunité", product.opportunity, `/scoring`],
                ["Plan", product.plan, `/planner`],
                ["Génération", product.generation, `/generator`],
                ["Images", product.images, `/images`],
                ["Mockups", product.mockups, `/mockups`],
                ["SEO", product.seo, `/seo`],
                ["QA", product.qa, `/qa`],
                ["Validation", product.validation, `/validation`],
                ["Publication", product.publication, `/publishing`],
              ] as const
            ).map(([label, section, href]) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/40"
              >
                <span>{label}</span>
                {section ? (
                  <span className="flex items-center gap-1.5">
                    <SourceTag source={(section as { meta: { source: string } }).meta.source} />
                    <StatusBadge status="completed" />
                  </span>
                ) : (
                  <StatusBadge status="pending" />
                )}
              </Link>
            ))}
          </div>

          {productWorkflows.length > 0 ? (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">Workflows</h3>
              <div className="space-y-4">
                {productWorkflows.map((w) => (
                  <div key={w.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <Link href={`/workflows/${w.id}`} className="font-mono text-sm hover:underline">
                        {w.id}
                      </Link>
                      <StatusBadge status={w.status} />
                      {w.dryRun ? (
                        <span className="rounded border px-1.5 text-[10px] text-muted-foreground">DRY-RUN</span>
                      ) : null}
                    </div>
                    <WorkflowGraph workflow={w} compact />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <SimpleTable
            head={["Date", "Étape", "Événement", "Note"]}
            rows={product.history
              .slice()
              .reverse()
              .map((h) => [
                <span key="d" className="font-mono text-xs text-muted-foreground">{fmtDate(h.at)}</span>,
                <span key="s" className="font-mono text-xs">{h.step}</span>,
                h.event,
                h.note ?? "—",
              ])}
          />

          <JsonInspector label="Product Object complet (Core/state/products)" value={product} />
        </section>
      ) : (
        <p className="mx-auto mt-8 max-w-5xl rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Ce produit n&apos;a pas encore de Product Object — la pipeline n&apos;a pas (encore) traité <span className="font-mono">{slug}</span>.
        </p>
      )}
    </>
  );
}
