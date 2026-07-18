// Shared shell for the pipeline-section pages (Trends, Market, Scoring, …):
// one card per Product Object that has the section, with title, source tag,
// generation time and a link to the Product Inspector. Server-side only —
// the render callback never crosses a client boundary.

import Link from "next/link";
import type { ReactNode } from "react";
import { getProducts } from "@/lib/state";
import type { ProductObject } from "@/lib/engine-types";
import { PageHeader, EmptyState, SourceTag, fmtDate } from "./primitives";

export async function SectionPage<K extends keyof ProductObject>({
  title,
  description,
  section,
  render,
}: {
  title: string;
  description: string;
  section: K;
  render: (product: ProductObject, data: NonNullable<ProductObject[K]>) => ReactNode;
}) {
  const products = (await getProducts()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const withSection = products.filter((p) => p[section] != null);

  return (
    <>
      <PageHeader title={title} description={description} />
      {withSection.length === 0 ? (
        <EmptyState
          title="Aucune donnée pour cette étape"
          detail="Aucun Product Object ne porte encore cette section — lancer la pipeline (Core/engine, npm run pipeline)."
        />
      ) : (
        <div className="space-y-4">
          {withSection.map((p) => {
            const data = p[section] as NonNullable<ProductObject[K]> & {
              meta?: { source: string; generatedAt: string };
            };
            return (
              <section key={p.id} className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link href={`/products/${p.slug}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">{p.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {data.meta ? (
                      <>
                        <SourceTag source={data.meta.source} />
                        <span>{fmtDate(data.meta.generatedAt)}</span>
                      </>
                    ) : null}
                  </div>
                </div>
                {render(p, data)}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
